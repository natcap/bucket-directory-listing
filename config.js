var listing_config = {
	"releases.naturalcapitalproject.org": { // public domain of a bucket
		bucket_url: "https://www.googleapis.com/storage/v1/b/releases.naturalcapitalproject.org/o",
		exclude_files: ["index.html", "bucketlist.js", "latest.js", "latest.json", "config.js", "readme.md" ],
		// sort_option: "A2Z", // 'A2Z', 'Z2A', 'BIG2SMALL', 'SMALL2BIG'
		// root_dir: "invest/",
		special_bucket_objects: "latest.json"
	},
	"localhost:8000": { // another bucket domain
		bucket_url: "https://www.googleapis.com/storage/v1/b/releases.naturalcapitalproject.org/o",
		exclude_files: ["index.html", "bucketlist.js", "latest.js", "latest.json", "config.js", "readme.md"],
		// sort_option: "A2Z", // 'A2Z', 'Z2A', 'BIG2SMALL', 'SMALL2BIG'
		// root_dir: "invest/"	,
		special_bucket_objects: "latest.json"
	},
}

export { listing_config }