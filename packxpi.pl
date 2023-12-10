#!/usr/bin/perl

use strict;
use warnings;

use JSON;

use constant {
	MANIFEST_FILE => 'manifest.json',
	ZIP_EXTENSION => 'zip'
};

use constant FILE_LIST => qw(
	homeicon.svg
	icons
	manifest.json
	popup
	service-worker.js
);

local $/ = undef; # loads entire file into scalar

open my $handle, '<', MANIFEST_FILE
	or die $!;
my $manifest = decode_json(<$handle>);
close $handle;

my $extension_name = $manifest->{'name'};
my $extension_version = $manifest->{'version'};

$extension_name =~ s/ /-/g;
$extension_name = lc $extension_name;

my $zip_file_name = join '-', $extension_name, $extension_version;
$zip_file_name = join '.', $zip_file_name, ZIP_EXTENSION;

# skips hidden files
my @flags = qw(-x **/.* -x **/__MACOSX);

system('zip', '-r', $zip_file_name, FILE_LIST, @flags) == 0
	or die "Error creating zip file: $!\n" ;

print "\nSuccessfully packaged extension: $zip_file_name\n";