#!/usr/bin/perl

use strict;
use warnings;

use JSON;

use constant {
	MANIFEST_NAME     => 'manifest.json',
	FIREFOX_MANIFEST  => 'manifest-firefox.json',
	FIREFOX_EXTENSION => 'xpi',
	CHROME_MANIFEST   => 'manifest-chrome.json',
	CHROME_EXTENSION  => 'zip'
};

use constant FILE_LIST => qw(
	homeicon.svg
	icons
	popup
	service-worker.js
);

# package for Firefox
make_zip(FIREFOX_MANIFEST, FIREFOX_EXTENSION);
# package for Chrome
make_zip(CHROME_MANIFEST, CHROME_EXTENSION);

sub make_zip {
	my ($manifest_name, $extension) = @_;

	local $/ = undef; # loads entire file into scalar

	open my $handle, '<', $manifest_name
		or die $!;
	my $manifest = decode_json(<$handle>);
	close $handle;

	rename $manifest_name, MANIFEST_NAME
		or die $!;

	my $extension_name = $manifest->{'name'};
	my $extension_version = $manifest->{'version'};

	$extension_name =~ s/ /-/g;
	$extension_name =~ s/[^-\w]//g;
	$extension_name = lc $extension_name;

	my $zip_file_name = join '-', $extension_name, $extension_version;
	$zip_file_name = join '.', $zip_file_name, $extension;

	my @file_list = (MANIFEST_NAME, FILE_LIST);

	# skips hidden files
	my @flags = qw(-x **/.* -x **/__MACOSX);

	system('zip', '-r', $zip_file_name, @file_list, @flags) == 0
		or die "Error creating zip file: $!\n" ;

	rename MANIFEST_NAME, $manifest_name
		or die $!;

	print "Successfully packaged extension: $zip_file_name\n";
}