#!/bin/sh

while i=$(inotifywait -qre modify --exclude ".git|node_modules" ./); do
    set -- $i;
    # dir=$1
    evt=$2
    file=$3
    ext=${file##*.}
    echo "$evt '$file'";

    case $ext in
        js) npm --silent test ;;
    esac
done
