import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "../../features/auth/useAuth";
import { createEvent } from "../../features/events/eventApi";
import toast from "react-hot-toast";

export default function CreateEvent() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
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
        .split(',')
        .map(cat => cat.trim())
        .filter(cat => cat);

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
    <div className="min-h-screen pt-20 pb-12 bg-black">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/manage-events')}
            className="flex items-center space-x-2 text-purple-400 hover:text-purple-300 transition-colors mb-6"
          >
            <ArrowLeft size={20} />
            <span>Back to Events</span>
          </button>
          <h1 className="text-4xl font-bold text-white mb-2">Create New Event</h1>
          <p className="text-gray-400">Fill in the details to create your event</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6 bg-gray-900/50 border border-gray-800 rounded-xl p-8">
          {errors.submit && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg text-sm">
              {errors.submit}
            </div>
          )}

          {/* Basic Info */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Basic Information</h2>
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
                <label htmlFor="description" className="block text-sm font-medium text-white mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  placeholder="Describe your event"
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                  required
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                )}
              </div>

              <Input
                label="Categories (comma-separated)"
                type="text"
                name="categories"
                placeholder="e.g., Tech, Music, Sports"
                value={formData.categories}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Date & Time */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Date & Time</h2>
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
            <h2 className="text-xl font-semibold text-white mb-4">Venue Information</h2>
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
            <h2 className="text-xl font-semibold text-white mb-4">Event Details</h2>
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
          <div className="pt-6 border-t border-gray-800">
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
  );
}
