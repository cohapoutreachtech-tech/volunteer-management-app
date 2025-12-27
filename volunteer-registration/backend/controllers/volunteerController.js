const Volunteer = require('../models/Volunteer');

// Example: Creating a volunteer
const createVolunteer = async (req, res) => {
  // Use Salesforce-style fields from req.body
  const {
    First_Name__c,
    Last_Name__c,
    Email__c,
    Phone__c,
    Date_of_Birth__c,
    Volunteer_Type__c,
    Company_Name__c,
    Profile_Picture_URL__c,
    Facebook_Handle__c,
    Instagram_Handle__c,
    Text_Opt_In__c,
    T_Shirt_Size__c,
    Why_Volunteer__c,
    Events_Signed_Up__c,
    Total_Hours_Available__c,
    Community_Service_Hours__c,
    Volunteer_Assignments__c,
    Other_Assignment__c,
    Tasks_to_Avoid__c,
    Skills_to_Use__c,
    Certifications__c,
    Certification_File_URL__c,
    Time_Preference__c,
    Day_Preference__c,
    Location_Preference__c,
    Comfortable_With__c,
    Accommodations_Needed__c,
    Offender_Policy_Confirmed__c,
    Additional_Comments__c,
    Electronic_Signature__c,
    Signature_Date__c,
    Registration_Date__c,
    Status__c,
    password
  } = req.body;

  try {
    const volunteer = new Volunteer({
      name: 'VOL-000X', // generate or leave for auto-number
      First_Name__c,
      Last_Name__c,
      Email__c,
      Phone__c,
      Date_of_Birth__c,
      Volunteer_Type__c,
      Company_Name__c,
      Profile_Picture_URL__c,
      Facebook_Handle__c,
      Instagram_Handle__c,
      Text_Opt_In__c,
      T_Shirt_Size__c,
      Why_Volunteer__c,
      Events_Signed_Up__c,
      Total_Hours_Available__c,
      Community_Service_Hours__c,
      Volunteer_Assignments__c,
      Other_Assignment__c,
      Tasks_to_Avoid__c,
      Skills_to_Use__c,
      Certifications__c,
      Certification_File_URL__c,
      Time_Preference__c,
      Day_Preference__c,
      Location_Preference__c,
      Comfortable_With__c,
      Accommodations_Needed__c,
      Offender_Policy_Confirmed__c,
      Additional_Comments__c,
      Electronic_Signature__c,
      Signature_Date__c,
      Registration_Date__c,
      Status__c,
      password
    });
    await volunteer.save();
    res.status(201).json({ message: 'Volunteer created', volunteer });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Example: Find volunteer by email
const getVolunteerByEmail = async (req, res) => {
  const { email } = req.params;
  const volunteer = await Volunteer.findOne({ Email__c: email });
  if (!volunteer) {
    return res.status(404).json({ message: 'Volunteer not found' });
  }
  res.json(volunteer);
};

// Example: Update volunteer
const updateVolunteer = async (req, res) => {
  const { id } = req.params;
  const updateFields = req.body; // Should use Salesforce field names
  const volunteer = await Volunteer.findByIdAndUpdate(id, updateFields, { new: true });
  if (!volunteer) {
    return res.status(404).json({ message: 'Volunteer not found' });
  }
  res.json({ message: 'Volunteer updated', volunteer });
};

// Get all volunteers
const getAllVolunteers = async (req, res) => {
  try {
    const volunteers = await Volunteer.find({});
    res.json(volunteers);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = {
  createVolunteer,
  getVolunteerByEmail,
  updateVolunteer,
  getAllVolunteers
};