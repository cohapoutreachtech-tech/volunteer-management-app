import React, { useState } from 'react';
import '../styles/RegistrationPage.css';

const RegistrationPage = ({ onBack }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const [formData, setFormData] = useState({
    // Step 1: Personal Information
    firstName: '',
    lastName: '',
    companyName: '',
    email: '',
    phone: '',
    dobMonth: '',
    dobDay: '',
    dobYear: '',
    facebookHandle: '',
    instagramHandle: '',
    textOptIn: false,
    tshirtSize: '',
    volunteerType: 'individual',
    profilePicture: null,

    // Step 2: Volunteer Interests
    whyVolunteer: '',
    eventsSignedUp: [],
    otherEvent: '',
    totalHoursAvailable: '',
    communityServiceHours: '',
    volunteerAssignments: [],
    otherAssignment: '',
    tasksToAvoid: '',
    skillsToUse: '',
    skillsToDevelop: '',
    certifications: '',
    certificationFile: null,

    // Step 3: Availability & Preferences
    timePreference: [],
    dayPreference: [],
    locationPreference: '',
    comfortableWith: [],
    accommodations: '',

    // Step 4: Compliance
    offenderPolicyConfirmed: false,
    additionalComments: '',
    signature: ''
  });

  const [errors, setErrors] = useState({});

  // Get today's date formatted
  const getTodayDate = () => {
    const today = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return today.toLocaleDateString('en-US', options);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleCheckboxGroup = (name, value) => {
    const currentValues = formData[name];
    if (currentValues.includes(value)) {
      setFormData({
        ...formData,
        [name]: currentValues.filter(v => v !== value)
      });
    } else {
      setFormData({
        ...formData,
        [name]: [...currentValues, value]
      });
    }
  };

  const handleFileChange = (e) => {
    setFormData({
      ...formData,
      profilePicture: e.target.files[0]
    });
  };

  const handleCertificationFileChange = (e) => {
    setFormData({
      ...formData,
      certificationFile: e.target.files[0]
    });
  };

  const validateAllSteps = () => {
    const newErrors = {};

    // Step 1 validation
    if (!formData.firstName) newErrors.firstName = 'First name is required';
    if (!formData.lastName) newErrors.lastName = 'Last name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.phone) newErrors.phone = 'Phone is required';
    if (!formData.dobMonth || !formData.dobDay || !formData.dobYear) {
      newErrors.dob = 'Date of birth is required';
    }
    if (!formData.tshirtSize) newErrors.tshirtSize = 'T-shirt size is required';

    // Step 2 validation
    if (!formData.whyVolunteer) newErrors.whyVolunteer = 'This field is required';
    if (formData.eventsSignedUp.length === 0) newErrors.eventsSignedUp = 'Please select at least one event';
    if (!formData.totalHoursAvailable) newErrors.totalHoursAvailable = 'This field is required';
    if (!formData.communityServiceHours) newErrors.communityServiceHours = 'This field is required';

    // Step 4 validation
    if (!formData.offenderPolicyConfirmed) {
      newErrors.offenderPolicyConfirmed = 'You must confirm this policy to proceed';
    }
    if (!formData.signature || formData.signature.trim() === '') {
      newErrors.signature = 'Signature is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    setCurrentStep(currentStep + 1);
    window.scrollTo(0, 0);
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
    window.scrollTo(0, 0);
  };

  const handleSubmit = () => {
    if (validateAllSteps()) {
      console.log('Form submitted:', formData);
      console.log('Signature:', formData.signature);
      console.log('Date:', getTodayDate());
      alert('Registration submitted successfully!');
      // Here you would send the data to your backend
    } else {
      alert('Please fill in all required fields before submitting.');
      // Navigate to the first step with errors
      if (errors.firstName || errors.lastName || errors.email || errors.phone || errors.dob || errors.tshirtSize) {
        setCurrentStep(1);
      } else if (errors.whyVolunteer || errors.eventsSignedUp || errors.totalHoursAvailable || errors.communityServiceHours) {
        setCurrentStep(2);
      } else if (errors.offenderPolicyConfirmed || errors.signature) {
        setCurrentStep(4);
      }
      window.scrollTo(0, 0);
    }
  };

  const renderProgressBar = () => (
    <div className="progress-bar-container">
      <div className="progress-steps">
        {[1, 2, 3, 4].map(step => (
          <div key={step} className={`progress-step ${currentStep >= step ? 'active' : ''} ${currentStep === step ? 'current' : ''}`}>
            <div className="step-circle">{step}</div>
            <div className="step-label">
              {step === 1 && 'Personal Info'}
              {step === 2 && 'Interests'}
              {step === 3 && 'Availability'}
              {step === 4 && 'Compliance'}
            </div>
          </div>
        ))}
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${(currentStep / totalSteps) * 100}%` }}></div>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="form-step">
      <h2>Personal Information</h2>
      <p className="step-description">Tell us about yourself</p>

      <div className="form-row">
        <div className="form-group">
          <label>First Name *</label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            className={errors.firstName ? 'error' : ''}
          />
          {errors.firstName && <span className="error-message">{errors.firstName}</span>}
        </div>
        <div className="form-group">
          <label>Last Name *</label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            className={errors.lastName ? 'error' : ''}
          />
          {errors.lastName && <span className="error-message">{errors.lastName}</span>}
        </div>
      </div>

      <div className="form-group">
        <label>Are you volunteering as:</label>
        <div className="radio-group-horizontal">
          <label className="radio-label">
            <input
              type="radio"
              name="volunteerType"
              value="individual"
              checked={formData.volunteerType === 'individual'}
              onChange={handleInputChange}
            />
            Individual
          </label>
          <label className="radio-label">
            <input
              type="radio"
              name="volunteerType"
              value="company"
              checked={formData.volunteerType === 'company'}
              onChange={handleInputChange}
            />
            Company Representative
          </label>
        </div>
      </div>

      {formData.volunteerType === 'company' && (
        <div className="form-group">
          <label>Company Name</label>
          <input
            type="text"
            name="companyName"
            value={formData.companyName}
            onChange={handleInputChange}
          />
        </div>
      )}

      <div className="form-row">
        <div className="form-group">
          <label>Email Address *</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className={errors.email ? 'error' : ''}
          />
          {errors.email && <span className="error-message">{errors.email}</span>}
        </div>
        <div className="form-group">
          <label>Phone *</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            className={errors.phone ? 'error' : ''}
          />
          {errors.phone && <span className="error-message">{errors.phone}</span>}
        </div>
      </div>

      <div className="form-group">
        <label>Date of Birth *</label>
        <div className="dob-row">
          <select
            name="dobMonth"
            value={formData.dobMonth}
            onChange={handleInputChange}
            className={errors.dob ? 'error' : ''}
          >
            <option value="">Month</option>
            {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((month, i) => (
              <option key={i} value={i + 1}>{month}</option>
            ))}
          </select>
          <select
            name="dobDay"
            value={formData.dobDay}
            onChange={handleInputChange}
            className={errors.dob ? 'error' : ''}
          >
            <option value="">Day</option>
            {[...Array(31)].map((_, i) => (
              <option key={i} value={i + 1}>{i + 1}</option>
            ))}
          </select>
          <select
            name="dobYear"
            value={formData.dobYear}
            onChange={handleInputChange}
            className={errors.dob ? 'error' : ''}
          >
            <option value="">Year</option>
            {[...Array(100)].map((_, i) => {
              const year = new Date().getFullYear() - i;
              return <option key={i} value={year}>{year}</option>;
            })}
          </select>
        </div>
        {errors.dob && <span className="error-message">{errors.dob}</span>}
      </div>

      <div className="form-group">
        <label>T-Shirt Size *</label>
        <div className="radio-group-horizontal">
          {['XXS', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'].map(size => (
            <label key={size} className="radio-label">
              <input
                type="radio"
                name="tshirtSize"
                value={size}
                checked={formData.tshirtSize === size}
                onChange={handleInputChange}
              />
              {size}
            </label>
          ))}
        </div>
        {errors.tshirtSize && <span className="error-message">{errors.tshirtSize}</span>}
      </div>

      <div className="form-group">
        <label>Profile Picture (Optional)</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="file-input"
        />
        {formData.profilePicture && (
          <span className="file-selected">{formData.profilePicture.name}</span>
        )}
      </div>

      <div className="form-group">
        <label>Please provide your Facebook and/or Instagram handles</label>
        <input
          type="text"
          name="facebookHandle"
          placeholder="Facebook Handle"
          value={formData.facebookHandle}
          onChange={handleInputChange}
        />
      </div>

      <div className="form-group">
        <input
          type="text"
          name="instagramHandle"
          placeholder="Instagram Handle"
          value={formData.instagramHandle}
          onChange={handleInputChange}
        />
      </div>

      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            name="textOptIn"
            checked={formData.textOptIn}
            onChange={handleInputChange}
          />
          I consent to receive text messages, notifications, and announcements from COHAP Outreach Corporation regarding volunteer opportunities and events.
        </label>
      </div>
    </div>
  );

  const volunteerAssignmentOptions = [
    { value: 'Setup', description: 'Arrange furniture, equipment, and event space' },
    { value: 'Registration', description: 'Check-in attendees and manage sign-ups' },
    { value: 'Greeter', description: 'Welcome guests and provide directions' },
    { value: 'Parking Attendant', description: 'Direct traffic and assist with parking' },
    { value: 'Decorating', description: 'Create visual displays and festive atmosphere' },
    { value: 'Assembly of bags / backpacks', description: 'Pack and organize giveaway items' },
    { value: 'Organizing', description: 'Coordinate supplies and manage logistics' },
    { value: 'Food Server', description: 'Distribute meals and refreshments' },
    { value: 'Stage / lighting', description: 'Operate technical equipment for presentations' },
    { value: 'Clean up', description: 'Break down and restore venue after event' },
    { value: 'Other', description: '' }
  ];

  const renderStep2 = () => (
    <div className="form-step">
      <h2>Volunteer Interests</h2>
      <p className="step-description">Help us match you with the right opportunities</p>

      <div className="form-group">
        <label>Why do you want to volunteer for COHAP Outreach Corporation? *</label>
        <textarea
          name="whyVolunteer"
          value={formData.whyVolunteer}
          onChange={handleInputChange}
          rows={4}
          className={errors.whyVolunteer ? 'error' : ''}
        />
        {errors.whyVolunteer && <span className="error-message">{errors.whyVolunteer}</span>}
      </div>

      <div className="form-group">
        <label>Which event(s) do you want to volunteer for? *</label>
        <div className="checkbox-group">
          {[
            'Amazing Season of Hope Sharing the Harvest Festival on December 21, 2025',
            'MLK Day Celebration Parade on January 17, 2026',
            'Annual Car Show & Music on March 29, 2026',
            'Annual Back to School Bash on July 11, 2026',
            'Gala/Fashion Show on October 17, 2026',
            'Other'
          ].map(event => (
            <label key={event} className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.eventsSignedUp.includes(event)}
                onChange={() => handleCheckboxGroup('eventsSignedUp', event)}
              />
              {event}
            </label>
          ))}
        </div>
        {errors.eventsSignedUp && <span className="error-message">{errors.eventsSignedUp}</span>}
      </div>

      {formData.eventsSignedUp.includes('Other') && (
        <div className="form-group">
          <input
            type="text"
            name="otherEvent"
            placeholder="Please specify"
            value={formData.otherEvent}
            onChange={handleInputChange}
          />
        </div>
      )}

      <div className="form-group">
        <label>How many hours are you available in total? *</label>
        <input
          type="text"
          name="totalHoursAvailable"
          placeholder="e.g., 10-15 hours per month"
          value={formData.totalHoursAvailable}
          onChange={handleInputChange}
          className={errors.totalHoursAvailable ? 'error' : ''}
        />
        {errors.totalHoursAvailable && <span className="error-message">{errors.totalHoursAvailable}</span>}
      </div>

      <div className="form-group">
        <label>Are you volunteering to earn community service hours? *</label>
        <div className="radio-group-horizontal">
          <label className="radio-label">
            <input
              type="radio"
              name="communityServiceHours"
              value="yes"
              checked={formData.communityServiceHours === 'yes'}
              onChange={handleInputChange}
            />
            Yes
          </label>
          <label className="radio-label">
            <input
              type="radio"
              name="communityServiceHours"
              value="no"
              checked={formData.communityServiceHours === 'no'}
              onChange={handleInputChange}
            />
            No
          </label>
        </div>
        {errors.communityServiceHours && <span className="error-message">{errors.communityServiceHours}</span>}
      </div>

      <div className="form-group">
        <label>What type of volunteer assignments are you interested in? (Check all that apply)</label>
        <div className="checkbox-group">
          {volunteerAssignmentOptions.map(assignment => (
            <label key={assignment.value} className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.volunteerAssignments.includes(assignment.value)}
                onChange={() => handleCheckboxGroup('volunteerAssignments', assignment.value)}
              />
              <span>
                <strong>{assignment.value}</strong>
                {assignment.description && <span className="assignment-description"> - {assignment.description}</span>}
              </span>
            </label>
          ))}
        </div>
      </div>

      {formData.volunteerAssignments.includes('Other') && (
        <div className="form-group">
          <input
            type="text"
            name="otherAssignment"
            placeholder="Please specify"
            value={formData.otherAssignment}
            onChange={handleInputChange}
          />
        </div>
      )}

      <div className="form-group">
        <label>Are there any tasks you prefer to avoid?</label>
        <textarea
          name="tasksToAvoid"
          value={formData.tasksToAvoid}
          onChange={handleInputChange}
          rows={3}
        />
      </div>

      <div className="form-group">
        <label>What skills or strengths would you like to use while volunteering?</label>
        <textarea
          name="skillsToUse"
          value={formData.skillsToUse}
          onChange={handleInputChange}
          rows={3}
        />
      </div>


      <div className="form-group">
        <label>List relevant certifications or special training</label>
        <textarea
          name="certifications"
          value={formData.certifications}
          onChange={handleInputChange}
          rows={3}
          placeholder="For example: First Aid Training certification, Lifeguard certification"
        />
      </div>

      <div className="form-group">
        <label>Upload Certification Documents (Optional - PDF only)</label>
        <input
          type="file"
          accept="application/pdf"
          onChange={handleCertificationFileChange}
          className="file-input"
        />
        {formData.certificationFile && (
          <span className="file-selected">{formData.certificationFile.name}</span>
        )}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="form-step">
      <h2>Availability & Preferences</h2>
      <p className="step-description">Let us know when and where you can volunteer</p>

      <div className="form-group">
        <label>Time of Day Preference (Select all that apply)</label>
        <div className="checkbox-group">
          {[
            'Morning (8am-12pm)',
            'Afternoon (12pm-4pm)',
            'Evening (4pm-8pm)'
          ].map(time => (
            <label key={time} className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.timePreference.includes(time)}
                onChange={() => handleCheckboxGroup('timePreference', time)}
              />
              {time}
            </label>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>Day Preference (Select all that apply)</label>
        <div className="checkbox-group">
          {[
            'Fridays',
            'Saturdays',
            'Sundays'
          ].map(day => (
            <label key={day} className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.dayPreference.includes(day)}
                onChange={() => handleCheckboxGroup('dayPreference', day)}
              />
              {day}
            </label>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>Do you prefer:</label>
        <div className="radio-group">
          <label className="radio-label">
            <input
              type="radio"
              name="locationPreference"
              value="indoor"
              checked={formData.locationPreference === 'indoor'}
              onChange={handleInputChange}
            />
            Indoor assignments
          </label>
          <label className="radio-label">
            <input
              type="radio"
              name="locationPreference"
              value="outdoor"
              checked={formData.locationPreference === 'outdoor'}
              onChange={handleInputChange}
            />
            Outdoor assignments
          </label>
          <label className="radio-label">
            <input
              type="radio"
              name="locationPreference"
              value="no preference"
              checked={formData.locationPreference === 'no preference'}
              onChange={handleInputChange}
            />
            No preference
          </label>
        </div>
      </div>

      <div className="form-group">
        <label>Are you comfortable working with: (Select all that apply)</label>
        <div className="checkbox-group">
          {[
            'Children',
            'Seniors',
            'General public',
            'Animals',
            'Prefer not to say'
          ].map(option => (
            <label key={option} className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.comfortableWith.includes(option)}
                onChange={() => handleCheckboxGroup('comfortableWith', option)}
              />
              {option}
            </label>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>What accommodations do you need to volunteer comfortably?</label>
        <textarea
          name="accommodations"
          value={formData.accommodations}
          onChange={handleInputChange}
          rows={3}
          placeholder="e.g., wheelchair access, dietary restrictions, etc."
        />
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="form-step">
      <h2>Compliance & Final Thoughts</h2>
      <p className="step-description">Review and confirm your registration</p>

      <div className="form-group policy-section">
        <div className="policy-box">
          <p>
            Please know that many of our events are with children and abuse victims so it is 
            imperative you be sensitive to their situation. We also ask you to confirm that you 
            are not a registered sex offender or a past violent offender.
          </p>
        </div>
        <label className="checkbox-label policy-checkbox">
          <input
            type="checkbox"
            name="offenderPolicyConfirmed"
            checked={formData.offenderPolicyConfirmed}
            onChange={handleInputChange}
            className={errors.offenderPolicyConfirmed ? 'error' : ''}
          />
          <strong>I have read the above statement and affirm that I am not a past violent offender or registered sex offender. *</strong>
        </label>
        {errors.offenderPolicyConfirmed && (
          <span className="error-message">{errors.offenderPolicyConfirmed}</span>
        )}
      </div>

      <div className="form-group">
        <label>Do you have any thoughts or comments you would like to share?</label>
        <textarea
          name="additionalComments"
          value={formData.additionalComments}
          onChange={handleInputChange}
          rows={4}
        />
      </div>

      <div className="signature-section">
        <h3>Signature & Attestation</h3>
        <div className="signature-box">
          <p className="signature-statement">
            I hereby confirm that all information provided in this registration form is true, 
            accurate, and complete to the best of my knowledge. I understand that any false 
            information may result in the termination of my volunteer status with COHAP 
            Outreach Corporation.
          </p>
          
          <div className="form-group">
            <label>Electronic Signature (Type your full name) *</label>
            <input
              type="text"
              name="signature"
              value={formData.signature}
              onChange={handleInputChange}
              placeholder="Type your full name"
              className={`signature-input ${errors.signature ? 'error' : ''}`}
            />
            {errors.signature && <span className="error-message">{errors.signature}</span>}
            {formData.signature && (
              <div className="signature-preview">
                <em>{formData.signature}</em>
              </div>
            )}
          </div>

          <div className="signature-date">
            <strong>Date:</strong> {getTodayDate()}
          </div>
        </div>
      </div>

      <div className="review-summary">
        <h3>Review Your Information</h3>
        <div className="summary-grid">
          <div className="summary-item">
            <strong>Name:</strong> {formData.firstName} {formData.lastName}
          </div>
          <div className="summary-item">
            <strong>Email:</strong> {formData.email}
          </div>
          <div className="summary-item">
            <strong>Phone:</strong> {formData.phone}
          </div>
          <div className="summary-item">
            <strong>Events:</strong> {formData.eventsSignedUp.length} selected
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="registration-page">
      <div className="registration-header">
        <button className="btn-back" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to Login
        </button>
        <div className="header-content">
          <img src="/cohap.png" alt="COHAP" className="header-logo" />
          <h1>Volunteer Registration</h1>
          <p>Join our team and make a difference in your community</p>
        </div>
      </div>

      <div className="registration-container">
        <div className="registration-card">
          {renderProgressBar()}

          <div className="form-content">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
          </div>

          <div className="form-navigation">
            {currentStep > 1 && (
              <button className="btn-previous" onClick={handlePrevious}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
                Previous
              </button>
            )}
            {currentStep < totalSteps ? (
              <button className="btn-next" onClick={handleNext}>
                Next
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
            ) : (
              <button className="btn-submit" onClick={handleSubmit}>
                Submit Registration
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationPage;