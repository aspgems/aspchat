config.gem 'memcache-client', :lib => 'memcache'
require 'memcache_util'

# Load locales for countries from +locale+ directory into Rails
Dir[File.dirname(__FILE__) + '/locale/**/*.yml'].each do |file|
  I18n.load_path << file
end

I18n.load_path += Dir[ File.join(File.expand_path(File.dirname(__FILE__)), 'locale', '**', '*.{rb,yml}') ]