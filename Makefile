.PHONY: build run

dist := dist

obs_xpi := $(dist)/observer.xpi
obs_src := install.rdf bootstrap.js

proxy_xpi := $(dist)/proxy.xpi
proxy_src := install.rdf bootstrap.js

args := --app-arg="-jsconsole" --pref="xpinstall.signatures.required:false"

ifdef PROFILE
profile_arg := -p "$(PROFILE)"
endif

$(obs_xpi): $(addprefix observer/, $(obs_src))
	cd observer & xpi.py ../$(obs_xpi) $(obs_src)

$(proxy_xpi): $(addprefix proxy/, $(proxy_src))
	cd proxy & xpi.py ../$(proxy_xpi) $(proxy_src)

build: $(obs_xpi) $(proxy_xpi)

ifdef BINARY
run: $(obs_xpi) $(proxy_xpi)
	mozrunner -b "$(BINARY)" $(profile_arg) -a $(obs_xpi) -a $(proxy_xpi) $(args)
endif
