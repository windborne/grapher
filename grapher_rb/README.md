Wrapper around the grapher library in ruby gem form.

To publish:
1. Increment the version number in grapher_rb.gemspec
2. Run `gem build grapher_rb.gemspec`. This will create `grapher_rb-VERSION.gem`
3. Run `gem push --key github --host https://rubygems.pkg.github.com/windborne grapher_rb-VERSION.gem`. This will push the built gem to our private package repository on github. Note: you need to [be authenticated with github](https://help.github.com/en/packages/using-github-packages-with-your-projects-ecosystem/configuring-rubygems-for-use-with-github-packages#authenticating-to-github-packages) to do this.
