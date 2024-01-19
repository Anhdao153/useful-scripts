```
sed options 'script' file_name
```

Ref: https://www.hostinger.com/tutorials/how-to-use-linux-sed-command-examples

Options Description
```

–help – prints command usage information.
–debug – enables Terminal to annotate program execution and input.
-i – overwrites the original file.
-n – disables automatic printing unless the user uses the p command.
-u – minimizes output.
–posix – disables POSIX sed extensions to simplify writing portable scripts.
-e – specifies multiple commands to run sequentially.
-b – opens input files in binary mode.
-l – sets the desired line-wrap length for the l command.
```

#### Find and replace the whole line of $line_number in $out_file by $replace_string   
```shell
sed -i "$line_number s/.*$/$replace_string/g" $out_file
```

```shell
sed -i "10 s/.*$/abc/g" example.txt
```

### Convert snake_case (under_score) to PascalCase
```shell
result=$(echo "this_is_the_string" | sed -r 's/(^|_)([a-z])/\U\2/g')
```
