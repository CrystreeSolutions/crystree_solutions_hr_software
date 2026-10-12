
const admins = [
  {
    id: 1,
    name: "HRM Administrator",
    email: "admin@crystree.com",
    password: "Admin@123",
    designation: "Admin"
  }
];

const findAdminByEmail = (email) => {
  return admins.find(
    (admin) => admin.email.toLowerCase() === email.toLowerCase()
  );
};

const validateAdmin = (email, password) => {
  const admin = findAdminByEmail(email);

  if (!admin || admin.password !== password) {
    return null;
  }

  const { password: _, ...safeAdmin } = admin;
  return safeAdmin;
};

module.exports = {
  findAdminByEmail,
  validateAdmin
};
