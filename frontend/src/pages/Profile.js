import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { updateProfile, updatePassword, resetAuthState } from '../redux/slices/authSlice';

const Profile = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({
    name: '',
    email: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    slackNotifications: false,
    slackWebhookUrl: ''
  });

  const dispatch = useDispatch();
  const { user, loading, success, error } = useSelector(state => state.auth);

  // Initialize form data when user data is available
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || ''
      });
      
      // If user has notification settings, populate them
      if (user.notificationSettings) {
        setNotificationSettings({
          emailNotifications: user.notificationSettings.emailNotifications !== false,
          pushNotifications: user.notificationSettings.pushNotifications === true,
          slackNotifications: user.notificationSettings.slackNotifications === true,
          slackWebhookUrl: user.notificationSettings.slackWebhookUrl || ''
        });
      }
    }
  }, [user]);

  // Handle success state
  useEffect(() => {
    if (success) {
      toast.success('Profile updated successfully!');
      dispatch(resetAuthState());
    }
  }, [success, dispatch]);

  // Handle error state
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(resetAuthState());
    }
  }, [error, dispatch]);

  const handleProfileChange = e => {
    const { name, value } = e.target;
    setProfileData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handlePasswordChange = e => {
    const { name, value } = e.target;
    setPasswordData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleNotificationChange = e => {
    const { name, value, type, checked } = e.target;
    setNotificationSettings(prevState => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleProfileSubmit = e => {
    e.preventDefault();
    dispatch(updateProfile(profileData));
  };

  const handlePasswordSubmit = e => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    dispatch(updatePassword({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword
    }));
    
    // Clear password fields after submission
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  const handleNotificationSubmit = e => {
    e.preventDefault();
    
    // Validate Slack webhook URL if Slack notifications are enabled
    if (notificationSettings.slackNotifications && 
        !notificationSettings.slackWebhookUrl.startsWith('https://hooks.slack.com/')) {
      toast.error('Please enter a valid Slack webhook URL');
      return;
    }
    
    dispatch(updateProfile({
      notificationSettings
    }));
  };

  return (
    <div className="container mt-4 fade-in">
      <div className="row">
        <div className="col-md-3">
          <div className="card mb-4">
            <div className="card-body p-0">
              <div className="list-group list-group-flush">
                <button
                  className={`list-group-item list-group-item-action ${activeTab === 'profile' ? 'active' : ''}`}
                  onClick={() => setActiveTab('profile')}
                >
                  <i className="fas fa-user me-2"></i> Profile Information
                </button>
                <button
                  className={`list-group-item list-group-item-action ${activeTab === 'password' ? 'active' : ''}`}
                  onClick={() => setActiveTab('password')}
                >
                  <i className="fas fa-lock me-2"></i> Change Password
                </button>
                <button
                  className={`list-group-item list-group-item-action ${activeTab === 'notifications' ? 'active' : ''}`}
                  onClick={() => setActiveTab('notifications')}
                >
                  <i className="fas fa-bell me-2"></i> Notification Settings
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-9">
          <div className="card">
            {activeTab === 'profile' && (
              <>
                <div className="card-header">
                  <h2 className="mb-0">Profile Information</h2>
                </div>
                <div className="card-body">
                  <form onSubmit={handleProfileSubmit}>
                    <div className="mb-3">
                      <label htmlFor="name" className="form-label">Full Name</label>
                      <input
                        type="text"
                        className="form-control"
                        id="name"
                        name="name"
                        value={profileData.name}
                        onChange={handleProfileChange}
                        required
                      />
                    </div>
                    
                    <div className="mb-3">
                      <label htmlFor="email" className="form-label">Email Address</label>
                      <input
                        type="email"
                        className="form-control"
                        id="email"
                        name="email"
                        value={profileData.email}
                        onChange={handleProfileChange}
                        required
                      />
                    </div>
                    
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? (
                        <span>
                          <i className="fas fa-spinner fa-spin me-2"></i> Updating...
                        </span>
                      ) : (
                        'Update Profile'
                      )}
                    </button>
                  </form>
                </div>
              </>
            )}
            
            {activeTab === 'password' && (
              <>
                <div className="card-header">
                  <h2 className="mb-0">Change Password</h2>
                </div>
                <div className="card-body">
                  <form onSubmit={handlePasswordSubmit}>
                    <div className="mb-3">
                      <label htmlFor="currentPassword" className="form-label">Current Password</label>
                      <input
                        type="password"
                        className="form-control"
                        id="currentPassword"
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        required
                      />
                    </div>
                    
                    <div className="mb-3">
                      <label htmlFor="newPassword" className="form-label">New Password</label>
                      <input
                        type="password"
                        className="form-control"
                        id="newPassword"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        minLength="6"
                        required
                      />
                      <small className="form-text">Password must be at least 6 characters</small>
                    </div>
                    
                    <div className="mb-3">
                      <label htmlFor="confirmPassword" className="form-label">Confirm New Password</label>
                      <input
                        type="password"
                        className="form-control"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        minLength="6"
                        required
                      />
                    </div>
                    
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? (
                        <span>
                          <i className="fas fa-spinner fa-spin me-2"></i> Updating...
                        </span>
                      ) : (
                        'Change Password'
                      )}
                    </button>
                  </form>
                </div>
              </>
            )}
            
            {activeTab === 'notifications' && (
              <>
                <div className="card-header">
                  <h2 className="mb-0">Notification Settings</h2>
                </div>
                <div className="card-body">
                  <form onSubmit={handleNotificationSubmit}>
                    <div className="mb-3">
                      <div className="form-check form-switch">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="emailNotifications"
                          name="emailNotifications"
                          checked={notificationSettings.emailNotifications}
                          onChange={handleNotificationChange}
                        />
                        <label className="form-check-label" htmlFor="emailNotifications">
                          Email Notifications
                        </label>
                      </div>
                      <small className="form-text d-block mt-1">
                        Receive notifications about API status changes via email
                      </small>
                    </div>
                    
                    <div className="mb-3">
                      <div className="form-check form-switch">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="pushNotifications"
                          name="pushNotifications"
                          checked={notificationSettings.pushNotifications}
                          onChange={handleNotificationChange}
                        />
                        <label className="form-check-label" htmlFor="pushNotifications">
                          Push Notifications
                        </label>
                      </div>
                      <small className="form-text d-block mt-1">
                        Receive browser push notifications when an API status changes
                      </small>
                    </div>
                    
                    <div className="mb-3">
                      <div className="form-check form-switch">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="slackNotifications"
                          name="slackNotifications"
                          checked={notificationSettings.slackNotifications}
                          onChange={handleNotificationChange}
                        />
                        <label className="form-check-label" htmlFor="slackNotifications">
                          Slack Notifications
                        </label>
                      </div>
                      <small className="form-text d-block mt-1">
                        Receive notifications in your Slack workspace
                      </small>
                    </div>
                    
                    {notificationSettings.slackNotifications && (
                      <div className="mb-3">
                        <label htmlFor="slackWebhookUrl" className="form-label">Slack Webhook URL</label>
                        <input
                          type="url"
                          className="form-control"
                          id="slackWebhookUrl"
                          name="slackWebhookUrl"
                          value={notificationSettings.slackWebhookUrl}
                          onChange={handleNotificationChange}
                          placeholder="https://hooks.slack.com/services/..."
                          required={notificationSettings.slackNotifications}
                        />
                        <small className="form-text">
                          Enter your Slack webhook URL to receive notifications
                        </small>
                      </div>
                    )}
                    
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? (
                        <span>
                          <i className="fas fa-spinner fa-spin me-2"></i> Saving...
                        </span>
                      ) : (
                        'Save Notification Settings'
                      )}
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 