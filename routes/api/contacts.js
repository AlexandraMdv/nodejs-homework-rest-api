const express = require("express");
const router = express.Router();
const auth = require("../../middlewares/auth");

const {
  listContacts,
  getContactById,
  addContact,
  removeContact,
  updateContact,
  updateStatusContact,
} = require("../../models/contactsService.js");

// GET /api/contacts
router.get("/", auth, async (req, res, next) => {
  try {
    const { page = 1, limit = 10, favorite } = req.query;
    const skip = (page - 1) * limit;
    const filter = { owner: req.user._id };

    if (favorite !== undefined) {
      filter.favorite = favorite === "true";
    }

    const contacts = await listContacts(filter, skip, limit);
    res.json(contacts);
  } catch (error) {
    next(error);
  }
});

// GET /api/contacts/:contactId
router.get("/:contactId", auth, async (req, res, next) => {
  try {
    const contact = await getContactById(req.params.contactId, req.user._id);
    if (!contact) {
      return res.status(404).json({ message: "Not found" });
    }
    res.json(contact);
  } catch (error) {
    next(error);
  }
});

// POST /api/contacts
router.post("/", auth, async (req, res, next) => {
  try {
    const newContact = await addContact({
      ...req.body,
      owner: req.user._id,
    });
    res.status(201).json(newContact);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/contacts/:contactId
router.delete("/:contactId", auth, async (req, res, next) => {
  try {
    const contact = await removeContact(req.params.contactId, req.user._id);
    if (!contact) {
      return res.status(404).json({ message: "Not found" });
    }
    res.json({ message: "Contact deleted" });
  } catch (error) {
    next(error);
  }
});

// PUT /api/contacts/:contactId
router.put("/:contactId", auth, async (req, res, next) => {
  try {
    const updatedContact = await updateContact(
      req.params.contactId,
      req.body,
      req.user._id
    );
    if (!updatedContact) {
      return res.status(404).json({ message: "Not found" });
    }
    res.json(updatedContact);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/contacts/:contactId/favorite
router.patch("/:contactId/favorite", auth, async (req, res, next) => {
  try {
    if (req.body.favorite === undefined) {
      return res.status(400).json({ message: "missing field favorite" });
    }

    const updatedContact = await updateStatusContact(
      req.params.contactId,
      req.body,
      req.user._id
    );

    if (!updatedContact) {
      return res.status(404).json({ message: "Not found" });
    }

    res.status(200).json(updatedContact);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
