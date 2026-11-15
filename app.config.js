// Lets CI stamp each APK with an increasing versionCode so a new build installs over the old one.
module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    versionCode: Number(process.env.VERSION_CODE || config.android?.versionCode || 1),
  },
});
