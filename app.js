const express = require("express");
const fs = require("fs/promises");
const path = require("path");

const app = express();
const PORT = 5000;

// JSON file used as a simple data store (no database needed).
const DATA_FILE = path.join(__dirname, "courses.json");

// Allowed values for the course status field.
const ALLOWED_STATUSES = ["Not Started", "In Progress", "Completed"];

app.use(express.json());

/**
 * Ensures courses.json exists.
 * If the file does not exist, it creates it with an empty array ([]).
 */
async function ensureDataFileExists() {
  try {
    await fs.access(DATA_FILE);
  } catch (error) {
    // ENOENT means "file not found".
    if (error.code === "ENOENT") {
      await fs.writeFile(DATA_FILE, "[]", "utf8");
      return;
    }
    throw error;
  }
}

/**
 * Reads all courses from courses.json.
 * Returns an array of course objects.
 */
async function readCourses() {
  try {
    await ensureDataFileExists();
    const fileContent = await fs.readFile(DATA_FILE, "utf8");

    // If the file is empty for any reason, treat it as no data.
    if (!fileContent.trim()) {
      return [];
    }

    const parsed = JSON.parse(fileContent);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    // Throw a custom message to make API errors clearer for beginners.
    throw new Error(`Failed to read courses file: ${error.message}`);
  }
}

/**
 * Writes the full courses array back to courses.json.
 */
async function writeCourses(courses) {
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(courses, null, 2), "utf8");
  } catch (error) {
    throw new Error(`Failed to write courses file: ${error.message}`);
  }
}

/**
 * Validates if a string is in YYYY-MM-DD format and is a real date.
 */
function isValidDateString(dateString) {
  if (typeof dateString !== "string") {
    return false;
  }

  // Basic format check: YYYY-MM-DD
  const formatRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!formatRegex.test(dateString)) {
    return false;
  }

  // Real date check (e.g., rejects 2026-02-31)
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return false;
  }

  // Ensure input remains exactly the same after parsing.
  return date.toISOString().slice(0, 10) === dateString;
}

/**
 * Validates required fields for creating/updating a course.
 * Returns an array of validation error messages.
 */
function validateCourseInput(body) {
  const errors = [];

  if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
    errors.push("Field 'name' is required and must be a non-empty string.");
  }

  if (
    !body.description ||
    typeof body.description !== "string" ||
    !body.description.trim()
  ) {
    errors.push("Field 'description' is required and must be a non-empty string.");
  }

  if (!body.target_date || !isValidDateString(body.target_date)) {
    errors.push("Field 'target_date' is required and must be in YYYY-MM-DD format.");
  }

  if (!body.status || !ALLOWED_STATUSES.includes(body.status)) {
    errors.push(
      `Field 'status' is required and must be one of: ${ALLOWED_STATUSES.join(", ")}.`
    );
  }

  return errors;
}

/**
 * Generates the next numeric ID (starting from 1).
 */
function getNextId(courses) {
  if (courses.length === 0) {
    return 1;
  }

  const maxId = courses.reduce((max, course) => {
    return course.id > max ? course.id : max;
  }, 0);

  return maxId + 1;
}

/**
 * POST /api/courses
 * Adds a new course.
 */
app.post("/api/courses", async (req, res, next) => {
  try {
    const errors = validateCourseInput(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        message: "Validation failed.",
        errors,
      });
    }

    const courses = await readCourses();

    const newCourse = {
      id: getNextId(courses),
      name: req.body.name.trim(),
      description: req.body.description.trim(),
      target_date: req.body.target_date,
      status: req.body.status,
      created_at: new Date().toISOString(),
    };

    courses.push(newCourse);
    await writeCourses(courses);

    return res.status(201).json({
      message: "Course created successfully.",
      data: newCourse,
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/courses
 * Returns all courses.
 */
app.get("/api/courses", async (req, res, next) => {
  try {
    const courses = await readCourses();
    return res.status(200).json({
      message: "Courses fetched successfully.",
      count: courses.length,
      data: courses,
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/courses/:id
 * Returns one course by id.
 */
app.get("/api/courses/:id", async (req, res, next) => {
  try {
    const courseId = Number(req.params.id);
    if (!Number.isInteger(courseId) || courseId < 1) {
      return res.status(400).json({ message: "Course ID must be a positive integer." });
    }

    const courses = await readCourses();
    const course = courses.find((item) => item.id === courseId);

    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    return res.status(200).json({
      message: "Course fetched successfully.",
      data: course,
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * PUT /api/courses/:id
 * Updates all editable fields for a course.
 */
app.put("/api/courses/:id", async (req, res, next) => {
  try {
    const courseId = Number(req.params.id);
    if (!Number.isInteger(courseId) || courseId < 1) {
      return res.status(400).json({ message: "Course ID must be a positive integer." });
    }

    const errors = validateCourseInput(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        message: "Validation failed.",
        errors,
      });
    }

    const courses = await readCourses();
    const courseIndex = courses.findIndex((item) => item.id === courseId);

    if (courseIndex === -1) {
      return res.status(404).json({ message: "Course not found." });
    }

    // Keep original created_at, update other fields.
    const updatedCourse = {
      ...courses[courseIndex],
      name: req.body.name.trim(),
      description: req.body.description.trim(),
      target_date: req.body.target_date,
      status: req.body.status,
    };

    courses[courseIndex] = updatedCourse;
    await writeCourses(courses);

    return res.status(200).json({
      message: "Course updated successfully.",
      data: updatedCourse,
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * DELETE /api/courses/:id
 * Deletes a course by id.
 */
app.delete("/api/courses/:id", async (req, res, next) => {
  try {
    const courseId = Number(req.params.id);
    if (!Number.isInteger(courseId) || courseId < 1) {
      return res.status(400).json({ message: "Course ID must be a positive integer." });
    }

    const courses = await readCourses();
    const courseIndex = courses.findIndex((item) => item.id === courseId);

    if (courseIndex === -1) {
      return res.status(404).json({ message: "Course not found." });
    }

    const deletedCourse = courses[courseIndex];
    courses.splice(courseIndex, 1);
    await writeCourses(courses);

    return res.status(200).json({
      message: "Course deleted successfully.",
      data: deletedCourse,
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * Global error handler:
 * catches file I/O errors and any unexpected server errors.
 */
app.use((error, req, res, next) => {
  // If headers already sent, delegate to Express default handler.
  if (res.headersSent) {
    return next(error);
  }

  return res.status(500).json({
    message: "Internal server error.",
    error: error.message,
  });
});

app.listen(PORT, async () => {
  try {
    await ensureDataFileExists();
    console.log(`CodeCraftHub API server running on http://localhost:${PORT}`);
  } catch (error) {
    console.error("Failed to initialize data file:", error.message);
    process.exit(1);
  }
});
