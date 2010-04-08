# Aspchat utils
require 'fileutils'

class Aspchat
  
  def self.install
    name ||=(File.dirname(__FILE__).split "/")[-1]
    directory ||=File.expand_path(File.join(File.dirname(__FILE__),'..'))
    project_root=File.expand_path(File.join(directory,'..','..', '..'))
    puts "installing plugin #{name}"
    puts "checking project directories #{project_root} #{directory}"
    
        
    b_public_dir_exists=FileTest.directory?(File.join(project_root, 'public', 'aspchat'))
    
    
    if b_public_dir_exists
      puts "#{File.join(project_root, 'public', 'aspchat')} already exists" 
      puts "Plugin install aborted. Please remove the existing directories before trying to reinstall"  
      exit(-1)
    end  
    
    puts "Copying dir " + File.join(project_root,'public', 'aspchat')
    FileUtils.cp_r(File.join(directory,'public', 'aspchat'),File.join(project_root,'public', 'aspchat'))
  end

  def self.uninstall    
    puts "just remove the /public/aspchat directory, then uninstall this plugin as usual"       
  end
  
end

