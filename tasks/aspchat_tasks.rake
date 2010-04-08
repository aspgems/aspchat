namespace :aspchat do
  desc "Copies the static resources (install)"
  task :install => :environment do |t|
    Aspchat.install    
    puts IO.read(File.join(File.dirname(__FILE__), '..','README'))
  end
  
  desc "Removes the static resources (install)"
  task :uninstall => :environment do |t|
    Aspchat.uninstall
  end
  
  desc "Expires the inactive chat users"
  task :expire_users => :environment do |t|
    AspchatStore.expire_users(20)
  end
end
