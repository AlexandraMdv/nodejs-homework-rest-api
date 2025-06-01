const Contact = require("./contacts");

const listContacts = async (filter = {}, skip = 0, limit = 10) => {
  return await Contact.find(filter).skip(skip).limit(Number(limit));
};

const getContactById = async (contactId, userId) => {
  return await Contact.findOne({ _id: contactId, owner: userId });
};

const removeContact = async (contactId, userId) => {
  return await Contact.findOneAndDelete({ _id: contactId, owner: userId });
};

const addContact = async (body) => {
  return await Contact.create(body);
};

const updateContact = async (contactId, body, userId) => {
  return await Contact.findOneAndUpdate(
    { _id: contactId, owner: userId },
    body,
    { new: true }
  );
};

const updateStatusContact = async (contactId, body, userId) => {
  return await Contact.findOneAndUpdate(
    { _id: contactId, owner: userId },
    { favorite: body.favorite },
    { new: true }
  );
};

module.exports = {
  listContacts,
  getContactById,
  removeContact,
  addContact,
  updateContact,
  updateStatusContact,
};
// This code provides a service layer for managing contacts in a MongoDB database using Mongoose.
