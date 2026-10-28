const multer = require('multer');
const path = require('path');

// DISK STORAGE — files Backend/uploads/ folder mein save hongi
const storage = multer.diskStorage({
  // Kaunse folder mein save karna hai
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },

  // File ka unique naam banao (same naam se overwrite na ho)
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname); // e.g. ".jpg"
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    // Result: "coverImage-1714000000000-123456789.jpg"
  }
});

// FILE FILTER — sirf image files allow karo
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const isValid = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  if (isValid) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed! (jpg, jpeg, png, gif, webp)'), false);
  }
};

// MULTER INSTANCE with storage + filter + size limit
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // Max 5MB per file
  }
});

module.exports = upload;
