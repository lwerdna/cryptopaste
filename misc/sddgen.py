#!/usr/bin/env python

# generates the self-decrypting document (SDD) from:
# index.html, javascript, and css

import re
import sys

def load_file(fpath):
	fd = open(fpath)
	tmp = fd.read()
	fd.close()
	return tmp

def replace_func(inp, func, repl):
    print("replacing function -%s-" % func)
    regex = r'^function %s.*?^}' % func
    assert re.search(regex, inp, re.MULTILINE|re.DOTALL)
    return re.sub(regex, repl, inp, 0, re.MULTILINE|re.DOTALL)

def inline_css(html, fpath_css, external):
    print(f'inlining {fpath_css}')
    internal = '<style type="text/css">\n' + load_file(fpath_css) + '\n</style>\n'
    assert html.find(external) != -1
    return html.replace(external, internal)

index = load_file('index.html')

# convert external stylesheets to internal
index = inline_css(index, 'stylesheet.css', '<link rel="stylesheet" type="text/css" href="stylesheet.css" />')
index = inline_css(index, 'Skeleton-2.0.4/css/font.css', '<link href="Skeleton-2.0.4/css/font.css" rel="stylesheet" type="text/css">')
index = inline_css(index, 'Skeleton-2.0.4/css/normalize.css', '<link rel="stylesheet" href="Skeleton-2.0.4/css/normalize.css">')
index = inline_css(index, 'Skeleton-2.0.4/css/skeleton.css', '<link rel="stylesheet" href="Skeleton-2.0.4/css/skeleton.css">')

# find all '<script src="blah.js"></script>' in the index.html
includes = re.findall(r'<script src=".*"></script>', index)

# replace each '<script src="blah.js"></script>' with blah.js
for inc in includes:
	m = re.match(r'<script src="(.*)"></script>', inc)
	jsfile = m.group(1)
	print("replacing %s with %s" % (inc, jsfile))
	subst = ''
	subst += '\n<!-- from %s -->\n' % inc
	subst += '<script type="text/javascript">\n'
	subst += load_file(jsfile)
	subst += '</script>\n'
	index = index.replace(inc, subst)

# get rid of certain code blocks
index = replace_func(index, 'ajax_get', '')
index = replace_func(index, 'ajax_post', '')
index = replace_func(index, 'ajax_file', '')
index = replace_func(index, 'btn_encrypt', '')
index = replace_func(index, 'btn_host', '')
index = replace_func(index, 'btn_save_sdd', '')
index = replace_func(index, 'test_cast5', '')
index = replace_func(index, 'test_utf8', '')
index = replace_func(index, 'test', '')

# replace cryptopaste_init()
minimal_init = ''
minimal_init += 'function cryptopaste_init()\n'
minimal_init += '{\n'
minimal_init += '    set_globals();\n'
minimal_init += '    mode = "decrypt";\n'
minimal_init += '    gui_switch();\n'
minimal_init += '}\n\n'
index = replace_func(index, 'cryptopaste_init', minimal_init)

# write result back
print("writing sdd.html")
fd = open('sdd.html', 'w')
fd.write(index)
fd.close()	


