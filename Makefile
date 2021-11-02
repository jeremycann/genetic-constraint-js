.PHONY: all check clean distclean distcheck browserify uglify build


version := $(shell node -e "console.log(require('./package.json').version)")
npmbin := $(shell npm bin)


all: clean
	@echo "building: $(version)";                            \
	npm install;                                             \
	$(npmbin)/browserify lib/dist.js                         \
	  | tee ./js/genetic-constraint-$(version).js                       \
	  | $(npmbin)/uglifyjs > ./js/genetic-constraint-$(version).min.js; \
	echo "built:";                                           \
	ls -1 js/* | sed 's/^/  /'

check:
	@$(npmbin)/mocha -slow=10 --reporter spec 

distcheck: distclean all check

clean:
	rm -f js/*.js
	
distclean: clean
	rm -rf node_modules

browserify:
	$(npmbin)/browserify lib/dist.js | tee ./js/genetic-constraint-$(version).js;

uglify:
	$(npmbin)/uglifyjs ./js/genetic-constraint-$(version).js --output ./js/genetic-constraint-$(version).min.js;

build: clean browserify uglify