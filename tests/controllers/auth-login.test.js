const request = require("supertest");
const app = require("../../app");
const mongoose = require("mongoose");
const User = require("../../models/user");

describe("Auth controller - login", () => {
  let server;
  const testUser = {
    email: "testuser@example.com",
    password: "TestPassword123!",
    subscription: "starter",
  };

  beforeAll(async () => {
    // Conectare la baza de date de test
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    // Creează utilizatorul de test (hash-uiește parola dacă e nevoie)
    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash(testUser.password, 10);
    await User.create({
      email: testUser.email,
      password: hashedPassword,
      subscription: testUser.subscription,
    });
    server = app.listen(0); // pornește serverul pe un port random
  });

  afterAll(async () => {
    await User.deleteMany({ email: testUser.email });
    await mongoose.connection.close();
    server.close();
  });

  it("should return 200, a token and user object with email and subscription as strings", async () => {
    const res = await request(server)
      .post("/api/users/login")
      .send({ email: testUser.email, password: testUser.password });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(typeof res.body.token).toBe("string");

    expect(res.body).toHaveProperty("user");
    expect(typeof res.body.user.email).toBe("string");
    expect(typeof res.body.user.subscription).toBe("string");
  });

  it("should return 401 if password is incorrect", async () => {
    const res = await request(server)
      .post("/api/users/login")
      .send({ email: testUser.email, password: "WrongPassword!" });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message");
    expect(res.body.message).toMatch(/email or password is wrong/i);
  });
});
