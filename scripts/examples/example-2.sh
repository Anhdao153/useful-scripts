#!/bin/bash

# Replace 'yourfile.txt' with the name of your file
in_file="/home/ubuntu/.config/JetBrains/IntelliJIdea2023.2/scratches/onbin_api_template_def_items.txt"
in_file_full_line="/home/ubuntu/.config/JetBrains/IntelliJIdea2023.2/scratches/onbin_api_template_def_items_full_line.txt"
out_file="/home/ubuntu/.config/JetBrains/IntelliJIdea2023.2/scratches/onbin_api_template_grep_results.log"

#Reset out_file
echo "" > $out_file

# Check if the file exists
if [ -e "$in_file" ]; then
  # Use a while loop to read each line of the file
  line_count=0
  while IFS= read -r line; do
    line_count=$(($line_count + 1))
    echo "Line: $line_count"
#    echo $line
    # Process the line here,xou can replace the echo with your own code

#    grep_command="grep -nri -e \"$line\" ./ --exclude-dir={tmp,log,.git,db/migrate,node_modules,vendor,coverage,public,spec}"
    grep_command="grep -nri -e \"[^_]$line\" ./ --exclude-dir={tmp,log,.git,db/migrate,node_modules,vendor,coverage,public,spec}"
    echo $grep_command
    echo "----------" >> $out_file
    echo $grep_command >> $out_file
    eval $grep_command >> $out_file

    # If contains new() method then search in itself file
    if [[ "$line" == *".new("* ]]; then
      full_line=$(sed "$line_count,$line_count!d" $in_file_full_line)
      class_name=${full_line%.rb:*}
      class_name+=".rb"
      grep_command="grep -nri -e \"\(self.\| \)new(\" $class_name"
      echo "" >> $out_file
      echo $grep_command >> $out_file
      eval $grep_command >> $out_file
    fi

  done < "$in_file"
else
  echo "File '$file' does not exist."
fi
