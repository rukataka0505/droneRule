const astroConfig = {"base":"/","root":"file:///C:/Users/rukat/Downloads/%E3%83%89%E3%83%AD%E3%83%BC%E3%83%B3%E8%B3%87%E6%A0%BC%E3%80%80%E6%95%99%E5%89%87/drone-license-docs/","srcDir":"file:///C:/Users/rukat/Downloads/%E3%83%89%E3%83%AD%E3%83%BC%E3%83%B3%E8%B3%87%E6%A0%BC%E3%80%80%E6%95%99%E5%89%87/drone-license-docs/src/","build":{"assets":"_astro"},"markdown":{"shikiConfig":{"langs":[]}}};
const ecIntegrationOptions = {};
let ecConfigFileOptions = {};
try {
	ecConfigFileOptions = (await import('./ec-config_CzTTOeiV.mjs')).default;
} catch (e) {
	console.error('*** Failed to load Expressive Code config file "file:///C:/Users/rukat/Downloads/%E3%83%89%E3%83%AD%E3%83%BC%E3%83%B3%E8%B3%87%E6%A0%BC%E3%80%80%E6%95%99%E5%89%87/drone-license-docs/ec.config.mjs". You can ignore this message if you just renamed/removed the file.\n\n(Full error message: "' + (e?.message || e) + '")\n');
}

export { astroConfig, ecConfigFileOptions, ecIntegrationOptions };
