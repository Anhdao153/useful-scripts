#!/bin/bash

# Replace 'yourfile.txt' with the name of your file
in_file="/home/ubuntu/.config/JetBrains/IntelliJIdea2023.2/scratches/onbin_api_template_full.txt"
out_file="/home/ubuntu/.config/JetBrains/IntelliJIdea2023.2/scratches/onbin_api_template_def_items.txt"
out_file_full_line="/home/ubuntu/.config/JetBrains/IntelliJIdea2023.2/scratches/onbin_api_template_def_items_full_line.txt"


# Get the whole line of a matching line
grep "def .*(" $in_file > $out_file_full_line

# Only get the matched parts of a matching line
grep -o 'def .*(' $in_file > $out_file
# Remove duplicate "("
# Ex: initialize(add_csv_path: nil, del_csv_path: nil, logger: Logger.new( -> initialize(
sed -i -E 's/(.*)\((.*)\(/\1(/g' $out_file

#Replace "def " by "" (remove "def ")
sed -i 's/def //g' $out_file

# Only show line number
#grep -n "initialize(" $out_file | cut -f1 -d:

# PROCESS [initialize(] items
grep -n "initialize(" $out_file | cut -f1 -d: | while read -r line ; do
     echo "Processing $line"
     full_line=$(sed "$line,$line!d" $out_file_full_line)
     # EXTRACT CLASS_NAME FROM FULL LINE
     # https://stackoverflow.com/questions/16153446/bash-last-index-of
     # ./app/models/fax_number.rb:2: def initialize(fax_no)
     echo $full_line
     #./app/models/ftps_client.rb:13:  def initialize(host: nil, store_dir: "#{Rails.root}/tmp/ftps") -> ./app/models/ftps_client.rb:13:  def initialize
     class_name=${full_line%(*}
     # ./app/models/fax_number.rb:2: def initialize(fax_no) -> fax_number.rb:2: def initialize(fax_no)
     class_name=${class_name##*/}
     # fax_number.rb:2: def initialize(fax_no) -> fax_number
     class_name=${class_name%.rb:*}
     # Convert snake_case (under_score) to PascalCase
     # fax_number -> FaxNumber
     class_name=$(echo "$class_name" | sed -r 's/(^|_)([a-z])/\U\2/g')
     class_name+=".new("
     # Replace initialize( by ClassName.new(
     sed -i "$line s/.*$/$class_name/g" $out_file
 done

# Replace text at specified line number in file
#sed -i '34s/AAA/BBB/g' file_name

# Convert snake_case (under_score) to PascalCase
#$ echo "this_is_the_string" | sed -r 's/(^|_)([a-z])/\U\2/g'
