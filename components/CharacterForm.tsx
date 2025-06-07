const CharacterForm: React.FC<CharacterFormProps> = ({
  // ... existing props ...
}) => {
  return (
    <div className="p-4 sm:p-6 bg-[var(--bg-secondary)] text-[var(--text-primary)] h-full flex flex-col">
      <header className="mb-4 sm:mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-[var(--accent-primary)] text-center animate-fade-in">
          {character ? 'Edit Character' : 'Create New Character'}
        </h2>
        <p className="text-sm sm:text-base text-[var(--text-tertiary)] text-center mt-1 animate-fade-in-delay">
          {character ? 'Modify your character\'s details' : 'Design your own unique character'}
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4 flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-[var(--bg-tertiary)] scrollbar-track-[var(--bg-secondary)]">
        <div className="space-y-4">
          {/* Avatar Selection */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Avatar
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {AVAILABLE_AVATARS.map(avatar => (
                <button
                  key={avatar}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, avatar }))}
                  className={`p-2 text-2xl rounded-lg transition-all duration-200 ${
                    formData.avatar === avatar
                      ? 'bg-[var(--accent-primary)] text-[var(--button-text)]'
                      : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                  }`}
                >
                  {avatar}
                </button>
              ))}
            </div>
          </div>

          {/* Name Input */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Name
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg py-2 px-3 text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--input-focus)]"
              placeholder="Enter character name"
              required
            />
          </div>

          {/* Bio Input */}
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Bio
            </label>
            <textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg py-2 px-3 text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--input-focus)] min-h-[100px] resize-y"
              placeholder="Enter character bio"
              required
            />
          </div>

          {/* Personality Prompt */}
          <div>
            <label htmlFor="personalityPrompt" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Personality Prompt
            </label>
            <textarea
              id="personalityPrompt"
              value={formData.personalityPrompt}
              onChange={(e) => setFormData(prev => ({ ...prev, personalityPrompt: e.target.value }))}
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg py-2 px-3 text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--input-focus)] min-h-[150px] resize-y"
              placeholder="Describe how this character should behave and speak..."
              required
            />
          </div>

          {/* Categories */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Categories
            </label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_CATEGORIES.map(category => (
                <button
                  key={category}
                  type="button"
                  onClick={() => toggleCategory(category)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors duration-200 ${
                    formData.categories.includes(category)
                      ? 'bg-[var(--accent-primary)] text-[var(--button-text)]'
                      : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Voice Settings */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Voice Settings
            </label>
            <div className="space-y-3 bg-[var(--bg-tertiary)] p-3 rounded-lg">
              <div>
                <label htmlFor="voiceName" className="block text-xs text-[var(--text-tertiary)] mb-1">
                  Voice
                </label>
                <select
                  id="voiceName"
                  value={formData.voiceSettings.voiceName}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    voiceSettings: { ...prev.voiceSettings, voiceName: e.target.value }
                  }))}
                  className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg py-2 px-3 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--input-focus)]"
                >
                  {availableVoices.map(voice => (
                    <option key={voice.name} value={voice.name}>
                      {voice.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="pitch" className="block text-xs text-[var(--text-tertiary)] mb-1">
                    Pitch ({formData.voiceSettings.pitch})
                  </label>
                  <input
                    type="range"
                    id="pitch"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={formData.voiceSettings.pitch}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      voiceSettings: { ...prev.voiceSettings, pitch: parseFloat(e.target.value) }
                    }))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label htmlFor="rate" className="block text-xs text-[var(--text-tertiary)] mb-1">
                    Rate ({formData.voiceSettings.rate})
                  </label>
                  <input
                    type="range"
                    id="rate"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={formData.voiceSettings.rate}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      voiceSettings: { ...prev.voiceSettings, rate: parseFloat(e.target.value) }
                    }))}
                    className="w-full"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="lang" className="block text-xs text-[var(--text-tertiary)] mb-1">
                  Language
                </label>
                <select
                  id="lang"
                  value={formData.voiceSettings.lang}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    voiceSettings: { ...prev.voiceSettings, lang: e.target.value }
                  }))}
                  className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg py-2 px-3 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--input-focus)]"
                >
                  {AVAILABLE_LANGUAGES.map(lang => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex gap-3 pt-4 border-t border-[var(--border-color)]">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-[var(--button-secondary)] hover:bg-[var(--button-secondary-hover)] text-[var(--button-text)] font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 bg-[var(--button-primary)] hover:bg-[var(--button-hover)] text-[var(--button-text)] font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
          >
            {character ? 'Save Changes' : 'Create Character'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CharacterForm; 