/**
 * HireShield — Shared Validation Rules
 * Used by BOTH Signup and Profile Edit to ensure consistent validation.
 */

// ===== VALIDATION FUNCTIONS =====

export function validateEmail(email) {
  if (!email || !email.trim()) return 'Email is required';
  const trimmed = email.trim().toLowerCase();
  if (!trimmed.endsWith('@gmail.com')) return 'Only Gmail addresses are accepted (must end with @gmail.com)';
  const localPart = trimmed.replace('@gmail.com', '');
  if (localPart.length < 1) return 'Enter a valid Gmail address';
  if (!/^[a-zA-Z0-9._%+-]+$/.test(localPart)) return 'Email contains invalid characters';
  return '';
}

export function validatePhone(phone) {
  if (!phone || !phone.trim()) return 'Phone number is required';
  const digits = phone.trim().replace(/\D/g, '');
  if (digits.length < 10) return `Phone number must be exactly 10 digits (currently ${digits.length})`;
  if (digits.length > 10) return `Phone number must be exactly 10 digits (currently ${digits.length})`;
  if (!/^\d{10}$/.test(digits)) return 'Phone number must contain only digits';
  return '';
}

export function validateFullName(name) {
  if (!name || !name.trim()) return 'Full name is required';
  if (name.trim().length < 2) return 'Name must be at least 2 characters';
  if (name.trim().length > 100) return 'Name must be less than 100 characters';
  return '';
}

export function validatePassword(password) {
  if (!password) return 'Password is required';
  if (password.length < 6) return 'Password must be at least 6 characters';
  return '';
}

export function validateConfirmPassword(password, confirmPassword) {
  if (!confirmPassword) return 'Confirm your password';
  if (password !== confirmPassword) return 'Passwords do not match';
  return '';
}

export function validateProfessionalTitle(title) {
  if (!title || !title.trim()) return 'Professional title is required';
  if (title.trim().length < 2) return 'Title must be at least 2 characters';
  return '';
}

export function validateLocation(location) {
  if (!location || !location.trim()) return 'Please select a location';
  if (!LOCATIONS.includes(location)) return 'Please select a valid location from the list';
  return '';
}

export function validateEducation(education) {
  if (!education || !education.trim()) return 'Education is required';
  return '';
}

export function validateExperience(exp) {
  if (exp === '' || exp === null || exp === undefined) return 'Experience is required';
  const num = Number(exp);
  if (isNaN(num)) return 'Experience must be a valid number';
  if (num < 0) return 'Experience cannot be negative';
  if (num > 80) return 'Experience cannot exceed 80 years';
  if (!Number.isInteger(num) && exp.toString().split('.')[1]?.length > 1) return 'Use at most 1 decimal place';
  return '';
}

export function validateLinkedIn(url) {
  if (!url || !url.trim()) return ''; // optional
  const trimmed = url.trim();
  const linkedinRegex = /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?$/;
  if (!linkedinRegex.test(trimmed)) return 'Enter a valid LinkedIn URL (e.g., https://www.linkedin.com/in/username)';
  return '';
}

export function validateGitHub(url) {
  if (!url || !url.trim()) return ''; // optional
  const trimmed = url.trim();
  const githubRegex = /^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9_-]+\/?$/;
  if (!githubRegex.test(trimmed)) return 'Enter a valid GitHub URL (e.g., https://github.com/username)';
  return '';
}

export function validateSkills(skills) {
  if (!skills || skills.length === 0) return 'Select at least one skill';
  return '';
}

// ===== VALIDATE ALL APPLICANT FIELDS =====

export function validateApplicantStep1(data) {
  const errors = {};
  errors.fullName = validateFullName(data.fullName);
  errors.email = validateEmail(data.email);
  errors.password = validatePassword(data.password);
  errors.confirmPassword = validateConfirmPassword(data.password, data.confirmPassword);
  // Remove empty error strings
  return Object.fromEntries(Object.entries(errors).filter(([, v]) => v));
}

export function validateApplicantStep2(data) {
  const errors = {};
  errors.professionalTitle = validateProfessionalTitle(data.professionalTitle);
  errors.phone = validatePhone(data.phone);
  errors.location = validateLocation(data.location);
  errors.education = validateEducation(data.education);
  errors.yearsOfExperience = validateExperience(data.yearsOfExperience);
  errors.skills = validateSkills(data.skills);
  errors.linkedinUrl = validateLinkedIn(data.linkedinUrl);
  errors.githubUrl = validateGitHub(data.githubUrl);
  return Object.fromEntries(Object.entries(errors).filter(([, v]) => v));
}

export function validateApplicantProfile(data) {
  const errors = {};
  if (data.phone !== undefined) errors.phone = validatePhone(data.phone);
  if (data.professionalTitle !== undefined) errors.professionalTitle = validateProfessionalTitle(data.professionalTitle);
  if (data.location !== undefined) errors.location = validateLocation(data.location);
  if (data.education !== undefined) errors.education = validateEducation(data.education);
  if (data.yearsOfExperience !== undefined) errors.yearsOfExperience = validateExperience(data.yearsOfExperience);
  if (data.skills !== undefined) errors.skills = validateSkills(data.skills);
  if (data.linkedinUrl !== undefined) errors.linkedinUrl = validateLinkedIn(data.linkedinUrl);
  if (data.githubUrl !== undefined) errors.githubUrl = validateGitHub(data.githubUrl);
  return Object.fromEntries(Object.entries(errors).filter(([, v]) => v));
}

// ===== LOCATIONS LIST =====
export const LOCATIONS = [
  // Metro Cities
  'Chennai, Tamil Nadu',
  'Bangalore, Karnataka',
  'Hyderabad, Telangana',
  'Mumbai, Maharashtra',
  'Delhi, NCR',
  'Pune, Maharashtra',
  'Kolkata, West Bengal',
  'Ahmedabad, Gujarat',
  'Noida, Uttar Pradesh',
  'Gurgaon, Haryana',
  // Tier-2 Cities
  'Coimbatore, Tamil Nadu',
  'Madurai, Tamil Nadu',
  'Trichy, Tamil Nadu',
  'Salem, Tamil Nadu',
  'Erode, Tamil Nadu',
  'Tirunelveli, Tamil Nadu',
  'Vellore, Tamil Nadu',
  'Thanjavur, Tamil Nadu',
  'Kochi, Kerala',
  'Trivandrum, Kerala',
  'Mysore, Karnataka',
  'Mangalore, Karnataka',
  'Vizag, Andhra Pradesh',
  'Vijayawada, Andhra Pradesh',
  'Nagpur, Maharashtra',
  'Nashik, Maharashtra',
  'Indore, Madhya Pradesh',
  'Bhopal, Madhya Pradesh',
  'Jaipur, Rajasthan',
  'Lucknow, Uttar Pradesh',
  'Chandigarh, Punjab',
  'Bhubaneswar, Odisha',
  'Patna, Bihar',
  'Ranchi, Jharkhand',
  'Dehradun, Uttarakhand',
  'Guwahati, Assam',
  'Thiruvananthapuram, Kerala',
  // International
  'Remote',
  'Singapore',
  'Dubai, UAE',
  'London, UK',
  'New York, USA',
  'San Francisco, USA',
  'Toronto, Canada',
  'Sydney, Australia',
  'Berlin, Germany',
  'Other',
];

// ===== COMPREHENSIVE SKILLS LIST =====
export const SKILLS_LIST = {
  'Programming Languages': [
    'Java', 'Python', 'JavaScript', 'TypeScript', 'C', 'C++', 'C#', 'Go', 'Rust',
    'Ruby', 'PHP', 'Swift', 'Kotlin', 'Dart', 'Scala', 'R', 'MATLAB', 'Perl',
    'Shell Scripting', 'Assembly', 'VHDL', 'Verilog',
  ],
  'Frontend Frameworks': [
    'React', 'Angular', 'Vue.js', 'Next.js', 'Svelte', 'jQuery', 'Bootstrap',
    'Tailwind CSS', 'Material UI', 'Ant Design', 'HTML5', 'CSS3', 'SASS/SCSS',
  ],
  'Backend Frameworks': [
    'Spring Boot', 'Node.js', 'Express.js', 'Django', 'Flask', 'FastAPI',
    'Ruby on Rails', 'ASP.NET', 'Laravel', 'NestJS', 'Gin', 'Fiber',
  ],
  'Databases': [
    'MySQL', 'PostgreSQL', 'MongoDB', 'Oracle', 'SQL Server', 'SQLite',
    'Redis', 'Cassandra', 'DynamoDB', 'Firebase', 'Elasticsearch', 'Neo4j',
    'MariaDB', 'CouchDB',
  ],
  'Cloud & DevOps': [
    'AWS', 'Azure', 'Google Cloud (GCP)', 'Docker', 'Kubernetes', 'Terraform',
    'Jenkins', 'GitHub Actions', 'GitLab CI/CD', 'Ansible', 'Nginx', 'Apache',
    'Linux Administration', 'CI/CD', 'Serverless',
  ],
  'Mobile Development': [
    'React Native', 'Flutter', 'Android (Kotlin/Java)', 'iOS (Swift)',
    'Ionic', 'Xamarin', 'SwiftUI',
  ],
  'Data Science & AI/ML': [
    'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Keras',
    'NLP', 'Computer Vision', 'Data Analytics', 'Pandas', 'NumPy',
    'Scikit-learn', 'Power BI', 'Tableau', 'Apache Spark', 'Hadoop',
  ],
  'Embedded & Hardware': [
    'Arduino', 'Raspberry Pi', 'ARM Cortex', 'FPGA', 'IoT', 'RTOS',
    'Embedded C', 'Microcontrollers', 'PCB Design', 'AutoCAD',
    'SolidWorks', 'VLSI Design', 'Signal Processing',
  ],
  'Networking & Security': [
    'TCP/IP', 'DNS', 'DHCP', 'Firewalls', 'VPN', 'Network Security',
    'Cyber Security', 'Ethical Hacking', 'Penetration Testing', 'CCNA',
    'Wireshark', 'OWASP',
  ],
  'Testing & QA': [
    'Selenium', 'JUnit', 'TestNG', 'Cypress', 'Jest', 'Mocha',
    'Postman', 'JMeter', 'Appium', 'Manual Testing', 'Automation Testing',
    'Performance Testing', 'API Testing',
  ],
  'Design Tools': [
    'Figma', 'Adobe XD', 'Photoshop', 'Illustrator', 'Sketch',
    'Canva', 'InVision', 'After Effects', 'Premiere Pro', 'Blender',
    'UI/UX Design',
  ],
  'Project & Collaboration': [
    'Git', 'GitHub', 'GitLab', 'Bitbucket', 'Jira', 'Trello',
    'Confluence', 'Slack', 'Agile/Scrum', 'Kanban',
  ],
  'Soft Skills': [
    'Communication', 'Leadership', 'Teamwork', 'Problem Solving',
    'Critical Thinking', 'Time Management', 'Adaptability', 'Creativity',
    'Project Management', 'Public Speaking', 'Technical Writing',
  ],
};

// Flatten all skills into one array for quick search
export const ALL_SKILLS = Object.values(SKILLS_LIST).flat();
