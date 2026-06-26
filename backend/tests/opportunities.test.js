const request = require("supertest");
const express = require("express");
const opportunitiesRouter = require("../routes/opportunities");

const app = express();
app.use(express.json());

// Mock auth middleware and real-time socket
app.use((req, res, next) => {
  req.user = { id: 1, role: "admin" };
  req.io = {
    to: jest.fn().mockReturnValue({ emit: jest.fn() })
  };
  next();
});

// Mock the pool module
jest.mock("../config/db", () => {
  return {
    query: jest.fn().mockImplementation((query, params) => {
      if (query.includes("INSERT INTO opportunities")) {
        return Promise.resolve({
          rows: [{ id: 1, title: params[0], type: params[1], company: params[3] }]
        });
      }
      if (query.includes("SELECT id FROM users")) {
        return Promise.resolve({ rows: [] });
      }
      return Promise.resolve({ rows: [] });
    })
  };
});

app.use("/api/opportunities", opportunitiesRouter);

describe("Opportunities API Validation", () => {
  it("should fail validation if required fields are missing", async () => {
    const res = await request(app).post("/api/opportunities").send({});
    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toMatch(/Title is required/i);
  });

  it("should fail validation if type is invalid", async () => {
    const res = await request(app).post("/api/opportunities").send({
      title: "Valid Title",
      type: "InvalidType",
      company: "Valid Company"
    });
    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toMatch(/Invalid type/i);
  });

  it("should pass validation with valid data", async () => {
    const res = await request(app).post("/api/opportunities").send({
      title: "Valid Title",
      type: "Internship",
      company: "Valid Company"
    });
    expect(res.statusCode).toEqual(201);
    expect(res.body.title).toEqual("Valid Title");
  });
});
