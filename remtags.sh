# Get all tags containing a specific string
TAGS=$(git tag -l 'mobile@2.0.3-alpha*')

# Delete all matching tags
for tag in $TAGS; do
  git tag -d $tag
  git push origin :refs/tags/$tag
done