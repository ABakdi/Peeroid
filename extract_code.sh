#!/usr/bin/env bash


declare -a ignore_patterns
declare -a select_patterns

# Default ignore patterns
DEFAULT_IGNORE=(
    'node_modules/' 'dist/' 'build/' '\.git/' '\.idea/' '__pycache__/'
    '[Rr][Ee][Aa][Dd][Mm][Ee].*' '.*-lock\.yaml$' 'package-lock.json'
    'yarn.lock' '\.png$' '\.jpg$' '\.jpeg$' '\.gif$' '\.zip$'
    '\.tar\.gz$' '\.pdf$' '\.exe$'
)

while getopts "i:s:" opt; do
    case $opt in
        i) ignore_patterns+=("$OPTARG");;
        s) select_patterns+=("$OPTARG");;
        *) echo "Usage: $0 [-i ignore_pattern] [-s select_pattern]" >&2
           exit 1
           ;;
    esac
done
shift $((OPTIND -1))

ignore_patterns+=("${DEFAULT_IGNORE[@]}")

# Temporary file to store included files
TMPFILE=$(mktemp)

find . -type f | while read -r file; do
    file_path="${file#./}"

    # Selection filter
    if [ ${#select_patterns[@]} -gt 0 ]; then
        included=false
        for pattern in "${select_patterns[@]}"; do
            if [[ "$file_path" =~ $pattern ]]; then
                included=true
                break
            fi
        done
        if ! $included; then
            continue
        fi
    fi

    # Ignore filter
    for pattern in "${ignore_patterns[@]}"; do
        if [[ "$file_path" =~ $pattern ]]; then
            continue 2
        fi
    done

    echo "//$file_path"
    cat "$file"
    echo
    # Store in temporary file
    echo "$file_path" >> "$TMPFILE"
done

# Print directory structure using the temp file
echo -e "\n// Directory Structure\n"
awk -F/ '{
    for (i=1; i<=NF; i++) {
        path=(i == 1) ? $i : path "/" $i
        if (!seen[path]) {
            indent=""
            for (j=1; j < i; j++) {
                indent=indent "  "
            }
            if (i < NF) {
                printf "%s%s/\n", indent, $i
            } else {
                printf "%s%s\n", indent, $i
            }
            seen[path] = 1
        }
    }
}' "$TMPFILE"

# Cleanup temporary file
rm "$TMPFILE"
