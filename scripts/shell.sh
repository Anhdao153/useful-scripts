#!/bin/bash
# Check if the file exists
if [ -e "$in_file" ]; then
  echo "Process logic here"
else
  echo "File '$file' does not exist."
fi

# Use a while loop to read each line of the file
while IFS= read -r line; do
  echo "Process line here"
done <"$in_file"

# If contains new() method then search in itself file
if [[ "$line" == *".new("* ]]; then
fi

# Execute command by text
grep_command="grep -nri -e \"[^_]$line\" ./ --exclude-dir={tmp,log,.git,db/migrate,node_modules,vendor,coverage,public,spec}"
eval $grep_command >> $out_file
