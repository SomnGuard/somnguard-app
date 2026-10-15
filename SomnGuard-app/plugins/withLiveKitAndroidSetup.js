const { withMainApplication } = require('@expo/config-plugins');

function addImport(source, importLine) {
  if (source.includes(importLine)) return source;
  const packageLine = source.match(/^package\s+[^\r\n]+\r?\n/m);
  if (!packageLine || packageLine.index === undefined) {
    throw new Error('No se encontró la declaración package en MainApplication.');
  }
  const insertAt = packageLine.index + packageLine[0].length;
  return `${source.slice(0, insertAt)}\n${importLine}${source.slice(insertAt)}`;
}

function addKotlinSetup(source) {
  if (source.includes('LiveKitReactNative.setup(')) return source;
  let next = addImport(source, 'import com.livekit.reactnative.LiveKitReactNative');
  next = addImport(next, 'import com.livekit.reactnative.audio.AudioType');
  const onCreate = /(override\s+fun\s+onCreate\s*\(\)\s*\{\s*super\.onCreate\(\))/m;
  if (!onCreate.test(next)) throw new Error('No se encontró onCreate() en MainApplication.kt para inicializar LiveKit.');
  return next.replace(onCreate, '$1\n\n    LiveKitReactNative.setup(this, AudioType.CommunicationAudioType())');
}

function addJavaSetup(source) {
  if (source.includes('LiveKitReactNative.setup(')) return source;
  let next = addImport(source, 'import com.livekit.reactnative.LiveKitReactNative;');
  next = addImport(next, 'import com.livekit.reactnative.audio.AudioType;');
  const onCreate = /(@Override\s+public\s+void\s+onCreate\s*\(\)\s*\{\s*super\.onCreate\(\);)/m;
  if (!onCreate.test(next)) throw new Error('No se encontró onCreate() en MainApplication.java para inicializar LiveKit.');
  return next.replace(onCreate, '$1\n\n    LiveKitReactNative.setup(this, new AudioType.CommunicationAudioType());');
}

module.exports = function withLiveKitAndroidSetup(config) {
  return withMainApplication(config, (mod) => {
    const main = mod.modResults;
    if (main.language === 'kt') main.contents = addKotlinSetup(main.contents);
    else if (main.language === 'java') main.contents = addJavaSetup(main.contents);
    else throw new Error(`Lenguaje MainApplication no compatible con LiveKit: ${main.language}`);
    return mod;
  });
};
