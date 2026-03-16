import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "../../features/auth/useAuth";
import { createEvent } from "../../features/events/eventApi";
import toast from "react-hot-toast";
import Navbar from "../../components/common/Navbar";
import { useTheme } from "../../context/ThemeContext";

export default function CreateEvent() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    imageUrl: "",
    categories: "",
    startAt: "",
    endAt: "",
    venue: {
      name: "",
      address: "",
      city: ""
    },
    capacity: ""
  });
  const [errors, setErrors] = useState({});

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      const message = "Please select an image file";
      setErrors((prev) => ({ ...prev, imageUrl: message }));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, imageUrl: reader.result || "" }));
      setErrors((prev) => ({ ...prev, imageUrl: "" }));
    };
    reader.readAsDataURL(file);
  };

  // Redirect if not organizer
  if (isAuthenticated && user?.role !== "organizer") {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center bg-black">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-400 mb-8">Only organizers can create events.</p>
          <Button onClick={() => navigate("/")} variant="primary">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("venue.")) {
      const venueField = name.split(".")[1];
      setFormData(prev => ({
        ...prev,
        venue: {
          ...prev.venue,
          [venueField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Event title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Event description is required';
    }

    if (!formData.imageUrl.trim()) {
      newErrors.imageUrl = 'Event image is required';
    }

    if (!formData.categories) {
      newErrors.categories = 'Select a category';
    }

    if (!formData.startAt) {
      newErrors.startAt = 'Start date and time are required';
    }

    if (!formData.endAt) {
      newErrors.endAt = 'End date and time are required';
    }

    if (formData.startAt && formData.endAt) {
      const start = new Date(formData.startAt);
      const end = new Date(formData.endAt);
      if (start >= end) {
        newErrors.endAt = 'End date must be after start date';
      }
    }

    if (!formData.venue.name.trim()) {
      newErrors['venue.name'] = 'Venue name is required';
    }

    if (!formData.venue.address.trim()) {
      newErrors['venue.address'] = 'Venue address is required';
    }

    if (!formData.venue.city.trim()) {
      newErrors['venue.city'] = 'City is required';
    }

    if (!formData.capacity || parseInt(formData.capacity) <= 0) {
      newErrors.capacity = 'Capacity must be greater than 0';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const categoriesArray = formData.categories
        ? [formData.categories]
        : [];

      const eventData = {
        ...formData,
        categories: categoriesArray,
        capacity: parseInt(formData.capacity)
      };

      await createEvent(eventData);
      toast.success('Event created successfully!');
      navigate('/manage-events');
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to create event';
      toast.error(errorMsg);
      setErrors({ submit: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className={`min-h-screen pt-20 pb-12 ${isDark ? "bg-black text-white" : "bg-white text-black"}`}>
        <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className={`flex items-center space-x-2 transition-colors mb-6 ${isDark ? "text-purple-300 hover:text-purple-200" : "text-purple-700 hover:text-purple-800"}`}
          >
            <ArrowLeft size={20} />
            <span>Back to Events</span>
          </button>
          <h1 className={`text-4xl font-bold mb-2 ${isDark ? "text-white" : "text-black"}`}>Create New Event</h1>
          <p className={isDark ? "text-gray-400" : "text-slate-600"}>Fill in the details to create your event</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className={`space-y-6 rounded-xl p-8 ${isDark ? "bg-gray-900/50 border border-gray-800" : "bg-white border border-purple-100 shadow-sm"}`}>
          {errors.submit && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg text-sm">
              {errors.submit}
            </div>
          )}

          {/* Basic Info */}
          <div>
            <h2 className={`text-xl font-semibold mb-4 ${isDark ? "text-white" : "text-black"}`}>Basic Information</h2>
            <div className="space-y-4">
              <Input
                label="Event Title"
                type="text"
                name="title"
                placeholder="Enter event title"
                value={formData.title}
                onChange={handleChange}
                error={errors.title}
                required
              />

              <div>
                <label htmlFor="description" className={`block text-sm font-medium mb-2 ${isDark ? "text-white" : "text-black"}`}>
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  placeholder="Describe your event"
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                  className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors ${isDark ? "bg-gray-800 border border-gray-700 text-white placeholder-gray-400" : "bg-white border border-purple-200 text-black placeholder-slate-500"}`}
                  required
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                )}
              </div>

              <div>
                <label htmlFor="categories" className={`block text-sm font-medium mb-2 ${isDark ? "text-white" : "text-black"}`}>
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  id="categories"
                  name="categories"
                  value={formData.categories}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors ${isDark ? "bg-gray-800 border border-gray-700 text-white" : "bg-white border border-purple-200 text-black"}`}
                  required
                >
                  <option value="" disabled>Select a category</option>
                  <option value="concert">Concert</option>
                  <option value="theatre">Theatre</option>
                  <option value="family">Family</option>
                  <option value="other">Other</option>
                </select>
                {errors.categories && (
                  <p className="text-red-500 text-sm mt-1">{errors.categories}</p>
                )}
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? "text-white" : "text-black"}`}>
                  Event Image <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-4">
                  <div className={`h-16 w-24 rounded-lg overflow-hidden flex items-center justify-center text-xs ${isDark ? "bg-gray-800 border border-gray-700 text-gray-400" : "bg-white border border-purple-200 text-slate-500"}`}>
                    {formData.imageUrl ? (
                      <img src={formData.imageUrl} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                      <span>No image</span>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className={`text-sm ${isDark ? "text-gray-200" : "text-black"}`}
                  />
                </div>
                {errors.imageUrl && (
                  <p className="text-red-500 text-sm mt-1">{errors.imageUrl}</p>
                )}
              </div>
            </div>
          </div>

          {/* Date & Time */}
          <div>
            <h2 className={`text-xl font-semibold mb-4 ${isDark ? "text-white" : "text-black"}`}>Date & Time</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Start Date & Time"
                type="datetime-local"
                name="startAt"
                value={formData.startAt}
                onChange={handleChange}
                error={errors.startAt}
                required
              />

              <Input
                label="End Date & Time"
                type="datetime-local"
                name="endAt"
                value={formData.endAt}
                onChange={handleChange}
                error={errors.endAt}
                required
              />
            </div>
          </div>

          {/* Venue */}
          <div>
            <h2 className={`text-xl font-semibold mb-4 ${isDark ? "text-white" : "text-black"}`}>Venue Information</h2>
            <div className="space-y-4">
              <Input
                label="Venue Name"
                type="text"
                name="venue.name"
                placeholder="e.g., Convention Center"
                value={formData.venue.name}
                onChange={handleChange}
                error={errors['venue.name']}
                required
              />

              <Input
                label="Address"
                type="text"
                name="venue.address"
                placeholder="e.g., 123 Main Street"
                value={formData.venue.address}
                onChange={handleChange}
                error={errors['venue.address']}
                required
              />

              <Input
                label="City"
                type="text"
                name="venue.city"
                placeholder="e.g., New York"
                value={formData.venue.city}
                onChange={handleChange}
                error={errors['venue.city']}
                required
              />
            </div>
          </div>

          {/* Capacity */}
          <div>
            <h2 className={`text-xl font-semibold mb-4 ${isDark ? "text-white" : "text-black"}`}>Event Details</h2>
            <Input
              label="Capacity"
              type="number"
              name="capacity"
              placeholder="Maximum number of attendees"
              value={formData.capacity}
              onChange={handleChange}
              error={errors.capacity}
              required
              min="1"
            />
          </div>

          {/* Submit */}
          <div className={`pt-6 border-t ${isDark ? "border-gray-800" : "border-purple-100"}`}>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Creating Event...' : 'Create Event'}
            </Button>
          </div>
        </form>
        </div>
      </div>
    </>
  );
}
