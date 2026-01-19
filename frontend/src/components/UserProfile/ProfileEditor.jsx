/**
 * ProfileEditor Component
 * Edit user profile, avatar, bio, social links
 */

import React, { useState, useEffect, useRef } from 'react';
import './ProfileEditor.css';

export default function ProfileEditor({ userId, currentProfile, onSave, onCancel }) {
    const [formData, setFormData] = useState({
        username: '',
        bio: '',
        website: '',
        twitter: '',
        discord: '',
        instagram: '',
        telegram: '',
        avatar: null,
        bannerImage: null,
        privateProfile: false,
        emailNotifications: true,
        pushNotifications: true,
        hideActivity: false,
        hidePortfolio: false
    });

    const [avatarPreview, setAvatarPreview] = useState(null);
    const [bannerPreview, setBannerPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [activeTab, setActiveTab] = useState('general');
    const [characterCount, setCharacterCount] = useState(0);

    const avatarInputRef = useRef(null);
    const bannerInputRef = useRef(null);

    // Initialize form with current profile data
    useEffect(() => {
        if (currentProfile) {
            setFormData(prev => ({
                ...prev,
                username: currentProfile.username || '',
                bio: currentProfile.bio || '',
                website: currentProfile.website || '',
                twitter: currentProfile.twitter || '',
                discord: currentProfile.discord || '',
                instagram: currentProfile.instagram || '',
                telegram: currentProfile.telegram || '',
                privateProfile: currentProfile.privateProfile || false,
                emailNotifications: currentProfile.settings?.emailNotifications !== false,
                pushNotifications: currentProfile.settings?.pushNotifications !== false,
                hideActivity: currentProfile.settings?.hideActivity || false,
                hidePortfolio: currentProfile.settings?.hidePortfolio || false
            }));

            if (currentProfile.avatar) {
                setAvatarPreview(currentProfile.avatar);
            }
            if (currentProfile.bannerImage) {
                setBannerPreview(currentProfile.bannerImage);
            }
            setCharacterCount(currentProfile.bio?.length || 0);
        }
    }, [currentProfile]);

    // Handle text input changes
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        if (name === 'bio') {
            if (value.length <= 500) {
                setFormData(prev => ({ ...prev, [name]: value }));
                setCharacterCount(value.length);
            }
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };

    // Handle avatar upload
    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file size (5MB max)
            if (file.size > 5 * 1024 * 1024) {
                setError('Avatar must be less than 5MB');
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result);
                setFormData(prev => ({ ...prev, avatar: reader.result }));
                setError('');
            };
            reader.readAsDataURL(file);
        }
    };

    // Handle banner upload
    const handleBannerChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file size (10MB max)
            if (file.size > 10 * 1024 * 1024) {
                setError('Banner must be less than 10MB');
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setBannerPreview(reader.result);
                setFormData(prev => ({ ...prev, bannerImage: reader.result }));
                setError('');
            };
            reader.readAsDataURL(file);
        }
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            // Validate username
            if (formData.username && formData.username.length < 3) {
                throw new Error('Username must be at least 3 characters');
            }

            // Validate website URL
            if (formData.website && !formData.website.startsWith('http')) {
                throw new Error('Website must start with http:// or https://');
            }

            // Call parent save handler
            await onSave({
                profile: {
                    username: formData.username,
                    bio: formData.bio,
                    website: formData.website,
                    twitter: formData.twitter,
                    discord: formData.discord,
                    instagram: formData.instagram,
                    telegram: formData.telegram,
                    avatar: formData.avatar,
                    bannerImage: formData.bannerImage
                },
                settings: {
                    privateProfile: formData.privateProfile,
                    emailNotifications: formData.emailNotifications,
                    pushNotifications: formData.pushNotifications,
                    hideActivity: formData.hideActivity,
                    hidePortfolio: formData.hidePortfolio
                }
            });

            setSuccess('Profile updated successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="profile-editor">
            <div className="editor-container">
                <div className="editor-header">
                    <h2>Edit Profile</h2>
                    <button className="close-btn" onClick={onCancel}>&times;</button>
                </div>

                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}

                {/* Tabs */}
                <div className="editor-tabs">
                    <button
                        className={`tab ${activeTab === 'general' ? 'active' : ''}`}
                        onClick={() => setActiveTab('general')}
                    >
                        General
                    </button>
                    <button
                        className={`tab ${activeTab === 'social' ? 'active' : ''}`}
                        onClick={() => setActiveTab('social')}
                    >
                        Social Links
                    </button>
                    <button
                        className={`tab ${activeTab === 'privacy' ? 'active' : ''}`}
                        onClick={() => setActiveTab('privacy')}
                    >
                        Privacy
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* General Tab */}
                    {activeTab === 'general' && (
                        <div className="tab-content">
                            {/* Avatar Upload */}
                            <div className="form-section">
                                <label>Avatar</label>
                                <div className="avatar-upload">
                                    <div className="avatar-preview">
                                        {avatarPreview && (
                                            <img src={avatarPreview} alt="Avatar preview" />
                                        )}
                                        {!avatarPreview && (
                                            <div className="placeholder">📷</div>
                                        )}
                                    </div>
                                    <div className="upload-controls">
                                        <button
                                            type="button"
                                            className="upload-btn"
                                            onClick={() => avatarInputRef.current?.click()}
                                        >
                                            Upload Avatar
                                        </button>
                                        {avatarPreview && (
                                            <button
                                                type="button"
                                                className="remove-btn"
                                                onClick={() => {
                                                    setAvatarPreview(null);
                                                    setFormData(prev => ({ ...prev, avatar: null }));
                                                }}
                                            >
                                                Remove
                                            </button>
                                        )}
                                        <p className="help-text">JPG, PNG (Max 5MB)</p>
                                    </div>
                                </div>
                                <input
                                    ref={avatarInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarChange}
                                    style={{ display: 'none' }}
                                />
                            </div>

                            {/* Banner Upload */}
                            <div className="form-section">
                                <label>Banner Image</label>
                                <div className="banner-upload">
                                    <div className="banner-preview">
                                        {bannerPreview && (
                                            <img src={bannerPreview} alt="Banner preview" />
                                        )}
                                        {!bannerPreview && (
                                            <div className="placeholder">🖼️</div>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        className="upload-btn"
                                        onClick={() => bannerInputRef.current?.click()}
                                    >
                                        Upload Banner
                                    </button>
                                    {bannerPreview && (
                                        <button
                                            type="button"
                                            className="remove-btn"
                                            onClick={() => {
                                                setBannerPreview(null);
                                                setFormData(prev => ({ ...prev, bannerImage: null }));
                                            }}
                                        >
                                            Remove
                                        </button>
                                    )}
                                    <p className="help-text">JPG, PNG (Max 10MB, 1500x500px recommended)</p>
                                </div>
                                <input
                                    ref={bannerInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleBannerChange}
                                    style={{ display: 'none' }}
                                />
                            </div>

                            {/* Username */}
                            <div className="form-section">
                                <label htmlFor="username">Username</label>
                                <input
                                    type="text"
                                    id="username"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    placeholder="Your username"
                                    minLength={3}
                                    maxLength={30}
                                />
                                <p className="help-text">Alphanumeric characters and underscores only</p>
                            </div>

                            {/* Bio */}
                            <div className="form-section">
                                <label htmlFor="bio">Bio</label>
                                <textarea
                                    id="bio"
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleInputChange}
                                    placeholder="Tell us about yourself..."
                                    maxLength={500}
                                    rows={4}
                                />
                                <p className="help-text">{characterCount}/500 characters</p>
                            </div>

                            {/* Website */}
                            <div className="form-section">
                                <label htmlFor="website">Website</label>
                                <input
                                    type="url"
                                    id="website"
                                    name="website"
                                    value={formData.website}
                                    onChange={handleInputChange}
                                    placeholder="https://example.com"
                                />
                            </div>
                        </div>
                    )}

                    {/* Social Links Tab */}
                    {activeTab === 'social' && (
                        <div className="tab-content">
                            <div className="social-links">
                                <div className="form-section">
                                    <label htmlFor="twitter">
                                        <span className="platform-icon">𝕏</span> Twitter
                                    </label>
                                    <input
                                        type="text"
                                        id="twitter"
                                        name="twitter"
                                        value={formData.twitter}
                                        onChange={handleInputChange}
                                        placeholder="@username"
                                    />
                                </div>

                                <div className="form-section">
                                    <label htmlFor="discord">
                                        <span className="platform-icon">💬</span> Discord
                                    </label>
                                    <input
                                        type="text"
                                        id="discord"
                                        name="discord"
                                        value={formData.discord}
                                        onChange={handleInputChange}
                                        placeholder="username#1234"
                                    />
                                </div>

                                <div className="form-section">
                                    <label htmlFor="instagram">
                                        <span className="platform-icon">📷</span> Instagram
                                    </label>
                                    <input
                                        type="text"
                                        id="instagram"
                                        name="instagram"
                                        value={formData.instagram}
                                        onChange={handleInputChange}
                                        placeholder="@username"
                                    />
                                </div>

                                <div className="form-section">
                                    <label htmlFor="telegram">
                                        <span className="platform-icon">✈️</span> Telegram
                                    </label>
                                    <input
                                        type="text"
                                        id="telegram"
                                        name="telegram"
                                        value={formData.telegram}
                                        onChange={handleInputChange}
                                        placeholder="@username"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Privacy Tab */}
                    {activeTab === 'privacy' && (
                        <div className="tab-content">
                            <div className="privacy-settings">
                                <div className="setting-item">
                                    <div className="setting-info">
                                        <h4>Private Profile</h4>
                                        <p>Hide your profile from public view</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        name="privateProfile"
                                        checked={formData.privateProfile}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div className="setting-item">
                                    <div className="setting-info">
                                        <h4>Hide Activity</h4>
                                        <p>Don't show your activity feed to others</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        name="hideActivity"
                                        checked={formData.hideActivity}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div className="setting-item">
                                    <div className="setting-info">
                                        <h4>Hide Portfolio</h4>
                                        <p>Don't show your NFT collection publicly</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        name="hidePortfolio"
                                        checked={formData.hidePortfolio}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div className="divider"></div>

                                <div className="setting-item">
                                    <div className="setting-info">
                                        <h4>Email Notifications</h4>
                                        <p>Receive email updates</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        name="emailNotifications"
                                        checked={formData.emailNotifications}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div className="setting-item">
                                    <div className="setting-info">
                                        <h4>Push Notifications</h4>
                                        <p>Receive browser push notifications</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        name="pushNotifications"
                                        checked={formData.pushNotifications}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Form Actions */}
                    <div className="form-actions">
                        <button type="button" className="cancel-btn" onClick={onCancel} disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="save-btn" disabled={loading}>
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
