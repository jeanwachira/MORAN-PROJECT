const mongoose = require('mongoose');
const fs = require('fs').promises;
const Papa = require('papaparse');

// Load environment variables FIRST
require('dotenv').config();

// Import your models
const Mentee = require('./models/Mentees');
const Parents = require('./models/Parents');
const Cohort = require('./models/Cohort');
const Activity = require('./models/Activity');

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error('❌ MONGO_URI is not defined in environment variables');
    console.error('💡 Make sure you have a .env file with MONGO_URI defined');
    process.exit(1);
}

// Helper function to parse date in MM/DD/YYYY format
function parseDate(dateString) {
    if (!dateString) return null;
    try {
        const [month, day, year] = dateString.split('/');
        return new Date(`${year}-${month}-${day}`);
    } catch (error) {
        return null;
    }
}

// Helper function to clean phone numbers
function cleanPhone(phone) {
    if (!phone) return '';
    return String(phone).trim().replace(/\s+/g, '').replace(/[^\d+]/g, '');
}

// Helper function to clean email
function cleanEmail(email) {
    if (!email) return '';
    return String(email).trim().toLowerCase().replace(/\s+/g, '');
}

// Helper function to determine school system
function determineSchoolSystem(grade) {
    if (!grade) return 'CBC';
    const gradeStr = String(grade).toLowerCase();
    if (gradeStr.includes('class') || gradeStr.includes('std')) return '8-4-4';
    if (gradeStr.includes('year') || gradeStr.includes('grade')) return 'IGCSE';
    return 'CBC';
}

// Helper function to extract cohort info from package selection
function extractCohortInfo(cohortString) {
    if (!cohortString) return null;
    
    const str = String(cohortString);
    
    // Pattern for: "3rd – 13th July 2025" or "3rd - 13th July 2025"
    // Also handles em-dashes, en-dashes, and regular hyphens
    const dateMatch = str.match(/(\d+)(?:st|nd|rd|th)?\s*[\-–—]\s*(\d+)(?:st|nd|rd|th)?\s+(\w+)\s+(\d{4})/i);
    
    if (!dateMatch) {
        console.log('   ⚠️  Failed to parse cohort string:', str);
        return null;
    }
    
    const [, startDay, endDay, month, year] = dateMatch;
    const monthMap = {
        'January': 1, 'February': 2, 'March': 3, 'April': 4,
        'May': 5, 'June': 6, 'July': 7, 'August': 8,
        'September': 9, 'October': 10, 'November': 11, 'December': 12,
        // Also handle short forms
        'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4,
        'Jun': 6, 'Jul': 7, 'Aug': 8, 'Sep': 9, 'Sept': 9,
        'Oct': 10, 'Nov': 11, 'Dec': 12
    };
    
    const monthNum = monthMap[month];
    if (!monthNum) {
        console.log('   ⚠️  Unknown month:', month);
        return null;
    }
    
    return {
        startDate: new Date(parseInt(year), monthNum - 1, parseInt(startDay)),
        endDate: new Date(parseInt(year), monthNum - 1, parseInt(endDay)),
        year: parseInt(year),
        month: month
    };
}

// Main import function
async function importData() {
    try {
        console.log('🚀 Starting CSV import...\n');
        console.log('Connecting to MongoDB...');
        console.log(`Using MONGO_URI: ${MONGO_URI.substring(0, 30)}...`);
        
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Read CSV file
        console.log('📖 Reading CSV file...');
        const csvContent = await fs.readFile('registrations.csv', 'utf-8');
        
        // Parse CSV
        console.log('📊 Parsing CSV data...');
        const parseResult = Papa.parse(csvContent, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: false,
            transformHeader: (header) => header.trim()
        });

        const rows = parseResult.data;
        console.log(`✅ Found ${rows.length} rows to process\n`);
        
        // Debug: Print all column names from first row
        if (rows.length > 0) {
            console.log('📋 Detected columns:');
            Object.keys(rows[0]).forEach((col, idx) => {
                console.log(`   ${idx + 1}. "${col}"`);
            });
            console.log('\n');
        }

        // Track statistics
        const stats = {
            cohortsCreated: 0,
            parentsCreated: 0,
            menteesCreated: 0,
            skipped: 0,
            errors: []
        };

        // Create a map to store cohorts by unique key
        const cohortMap = new Map();

        // Process each row
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            
            try {
                const menteeName = row["Initiate's Name"];
                
                // Skip if no mentee name or empty row
                if (!menteeName || menteeName.trim() === '' || menteeName === 'N/A') {
                    stats.skipped++;
                    continue;
                }

                console.log(`\n[${i + 1}/${rows.length}] Processing: ${menteeName}`);

                // Extract cohort information - try multiple possible column names
                const cohortInfo = extractCohortInfo(
                    row["What Cohort would you like to sign your son up for?d you to the program."] ||
                    row["What Cohort would you like to sign your son up for?"] ||
                    row["Cohort"] ||
                    row["Package"] ||
                    ''
                );
                
                if (!cohortInfo) {
                    console.warn(`   ⚠️  Skipping: Could not extract cohort info`);
                    stats.errors.push({ row: i + 1, name: menteeName, error: 'Invalid cohort info' });
                    continue;
                }

                // Create or get cohort
                const cohortKey = `${cohortInfo.month}-${cohortInfo.year}`;
                let cohort;
                
                if (cohortMap.has(cohortKey)) {
                    cohort = cohortMap.get(cohortKey);
                } else {
                    cohort = await Cohort.findOne({
                        year: cohortInfo.year,
                        startDate: cohortInfo.startDate
                    });

                    if (!cohort) {
                        cohort = new Cohort({
                            riika: `${cohortInfo.month} ${cohortInfo.year}`,
                            year: cohortInfo.year,
                            residence: 'Nairobi',
                            startDate: cohortInfo.startDate,
                            endDate: cohortInfo.endDate
                        });
                        await cohort.save();
                        stats.cohortsCreated++;
                        console.log(`   ✅ Created cohort: ${cohort.riika}`);
                    }
                    
                    cohortMap.set(cohortKey, cohort);
                }

                // Create parents array
                const parentsToCreate = [];
                
                // Father
                const fatherName = row["Father's Name"];
                if (fatherName && fatherName !== 'N/A' && fatherName !== 'Deceased' && !fatherName.toLowerCase().includes('deceased')) {
                    const fatherEmail = cleanEmail(row["Email Address"]);
                    if (fatherEmail && fatherEmail.includes('@')) {
                        const existingFather = await Parents.findOne({ email: fatherEmail });
                        if (!existingFather) {
                            const fatherPhone = cleanPhone(row["Cellphone No:"]);
                            if (fatherPhone && fatherPhone.length >= 10) {
                                parentsToCreate.push({
                                    parent: 'Father',
                                    name: String(fatherName).trim(),
                                    phone: fatherPhone,
                                    profession: row["Father's Profession"] || 'Not specified',
                                    residence: row["Place of Work (Company/Business Name)"] || 'Not specified',
                                    email: fatherEmail,
                                    mentee: []
                                });
                            }
                        } else {
                            parentsToCreate.push(existingFather);
                        }
                    }
                }

                // Mother
                const motherName = row["Mother's Name"];
                if (motherName && motherName !== 'N/A') {
                    const motherEmail = cleanEmail(row["Email Address.2"]);
                    if (motherEmail && motherEmail.includes('@')) {
                        const existingMother = await Parents.findOne({ email: motherEmail });
                        if (!existingMother) {
                            const motherPhone = cleanPhone(row["Cellphone No"]);
                            if (motherPhone && motherPhone.length >= 10) {
                                parentsToCreate.push({
                                    parent: 'Mother',
                                    name: String(motherName).trim(),
                                    phone: motherPhone,
                                    profession: row["Mother's Profession"] || 'Not specified',
                                    residence: row["Place of Work (Company/Business Name).1"] || 'Not specified',
                                    email: motherEmail,
                                    mentee: []
                                });
                            }
                        } else {
                            parentsToCreate.push(existingMother);
                        }
                    }
                }

                if (parentsToCreate.length === 0) {
                    console.warn(`   ⚠️  Skipping: No valid parents`);
                    stats.errors.push({ row: i + 1, name: menteeName, error: 'No valid parents' });
                    continue;
                }

                // Create mentee
                const menteePhone = cleanPhone(row["Cellphone"]) || '0000000000';
                const menteeDOB = parseDate(row["Birth Date"]);
                
                if (!menteeDOB) {
                    console.warn(`   ⚠️  Skipping: Invalid date of birth`);
                    stats.errors.push({ row: i + 1, name: menteeName, error: 'Invalid DOB' });
                    continue;
                }

                const menteeData = {
                    name: String(menteeName).trim(),
                    cohort: cohort._id,
                    email: cleanEmail(row["Email Address"]) || `${menteeName.toLowerCase().replace(/\s+/g, '.')}@moranproject.com`,
                    dob: menteeDOB,
                    schoolSystem: determineSchoolSystem(row["Grade / Class / Year"]),
                    grade: String(row["Grade / Class / Year"] || 'Not specified'),
                    phone: menteePhone,
                    school: row["School"] || 'Not specified',
                    parents: [],
                    procedure: row["Kindly indicate which pac"] || row["Kindly indicate which package you are taking"] || 'Circumcision Package',
                    doctorName: 'To be assigned',
                    doctorEmail: 'doctor@moranproject.com'
                };

                const mentee = new Mentee(menteeData);
                await mentee.save();
                stats.menteesCreated++;
                console.log(`   ✅ Mentee created: ${mentee.admissionNumber}`);

                // Save parents and link to mentee
                const parentIds = [];
                for (const parentData of parentsToCreate) {
                    if (parentData._id) {
                        // Existing parent - just update mentee array
                        if (!parentData.mentee.includes(mentee._id)) {
                            parentData.mentee.push(mentee._id);
                            await parentData.save();
                        }
                        parentIds.push(parentData._id);
                    } else {
                        // New parent
                        parentData.mentee = [mentee._id];
                        const parent = new Parents(parentData);
                        await parent.save();
                        parentIds.push(parent._id);
                        stats.parentsCreated++;
                        console.log(`   ✅ Parent created: ${parent.name} (${parent.parent})`);
                    }
                }

                // Update mentee with parent IDs
                mentee.parents = parentIds;
                await mentee.save();

                // Create activity log
                await Activity.create({
                    type: 'mentee_created',
                    description: `Mentee ${mentee.name} registered via CSV import`,
                    entityType: 'Mentee',
                    entityId: mentee._id,
                    entityName: mentee.name,
                    user: 'system',
                    metadata: {
                        admissionNumber: mentee.admissionNumber,
                        cohort: cohort.riika,
                        importDate: new Date()
                    }
                });

            } catch (error) {
                console.error(`   ❌ Error: ${error.message}`);
                stats.errors.push({ 
                    row: i + 1, 
                    name: row["Initiate's Name"] || 'Unknown', 
                    error: error.message 
                });
            }
        }

        // Print summary
        console.log('\n' + '='.repeat(70));
        console.log('📊 IMPORT SUMMARY');
        console.log('='.repeat(70));
        console.log(`✅ Total rows in file: ${rows.length}`);
        console.log(`✅ Mentees created: ${stats.menteesCreated}`);
        console.log(`👨‍👩‍👦 Parents created: ${stats.parentsCreated}`);
        console.log(`📅 Cohorts created: ${stats.cohortsCreated}`);
        console.log(`⏭️  Rows skipped: ${stats.skipped}`);
        console.log(`❌ Errors: ${stats.errors.length}`);
        console.log('='.repeat(70));
        
        if (stats.errors.length > 0) {
            console.log('\n❌ ERRORS ENCOUNTERED:');
            console.log('='.repeat(70));
            stats.errors.slice(0, 20).forEach(err => {
                console.log(`Row ${err.row} (${err.name}): ${err.error}`);
            });
            if (stats.errors.length > 20) {
                console.log(`... and ${stats.errors.length - 20} more errors`);
            }
        }

        console.log('\n✅ Import completed successfully!');

    } catch (error) {
        console.error('💥 Fatal error:', error);
        throw error;
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Disconnected from MongoDB');
    }
}

// Run the import
importData()
    .then(() => {
        console.log('\n🎉 All done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Import failed:', error.message);
        process.exit(1);
    });