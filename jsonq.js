import _ from 'underscore';

var jsonq;
var jsqelem;
var verbose=0;

//################################
// queries
(()=>{
  jsonq = function (items, path, parent) {
    if (items instanceof jsonq) {
      return new jsonq.fn.init([].concat(items.items));
    }
    if (items instanceof jsqelem) {
      return new jsonq.fn.init([items]);
    }
    if (path === undefined) {
      path = '@';
    } else {
      if (parent !== undefined && path.length > 0) {
	path = `{parent.jpath}.{path}`;
      }
    } 
    if (_.isArray(items)) {
      /* unwrap array and create a jsqelem([]) element to be able
	 to travers toplevel path */ 
      items = _.map(items, (e,idx)=>{
	if ((e instanceof jsqelem)) {
	  return e.elem;
	}
	return e;
      });
      return new jsonq.fn.init(jsqelem(items));
    }
    items = jsonq.fn.wrap(items, path);
    return new jsonq.fn.init(items);
  };

  var init = function (items) {
    if (!_.isArray(items)) {
      items = [ items ];
    }
    this.items = items;
    return this;
  };

  jsonq.fn = jsonq.prototype = {
    constructor: jsonq,
    init : init,
    wrap: function (item, path) {
      if (!(item instanceof jsqelem)) {
	item = jsqelem(item, path);
      }
      return item;
    },
    _step: function (step) {
      this.items = step.split(/,/).flatMap((step)=>
	this.items.flatMap((e)=>{
	  if (_.isArray(e.elem) && isNaN(step)) {
	    /* non-index on a array : iterate and hash over all */
	    return e.resolveArray().flatMap((e_)=>e_.step(step));
	  }
	  return e.step(step);
	}));
      return this;
    },
    _resolveArray: function (step) {
      this.items = this.items.flatMap((e)=>{
	return e.resolveArray(step);
      });
      return this;
    },
    where: function (fn) {
      var a = jsonq(this);
      a.items = a.items.filter((e)=> fn(e));
      return a;
    },
    gather: function (path) {
      var a = jsonq(this);
      for (const step of path.split(/\//).filter((e)=>e!=="@")) {
	a._step(step);
      }
      return a._resolveArray();
    },
    unwrap: function (expectsingle=false) {
      var a=this.items.map((e)=>e.elem);
      return expectsingle ? a[0] : a;
    }
  };
  init.prototype = jsonq.fn; /* jquery(0) instanceof jquery === true */
})();

//################################
// elements

(()=>{
  jsqelem = function (e,p) {
    if (e === undefined)
      return [];
    return new jsqelem.fn.init(e,p);
  }
  var init = function (e, p) {
    this.elem = e;
    this.jpath = p;
  };

  jsqelem.fn = jsqelem.prototype = {
    constructor: jsqelem,
    init: init,
    step: function(step) {
      var l=0;
      var a = this.elem;
      var next = a[step];
      if (verbose) {
	console.log(`-----------\nstep:'${step}' on '${this.elem}' => ${next}`);
	console.log(this.elem);
	console.log(next);
      }
      return jsqelem(next,`${this.jpath}/${step}`)
    },
    resolveArray: function() {
      if (!_.isArray(this.elem)) {
	return this;
      }
      return _.map(this.elem,(e,idx)=>jsqelem(e,`${this.jpath}/${idx}`));
    },
    get: function(path) {
      var e = this.elem;
      var steps = path.split(/\//).filter((e)=>e!=="@");
      var last = undefined;
      if (steps.slice(-1)[0].includes(",")) {
	last = steps.pop();
      }
      for (const step of steps) {
	e = e[step];
	if (e === undefined) {
	  return undefined;
	}
      }
      if (last !== undefined) {
	var a = [];
	var laststeps = last.split(/,/);
	return laststeps.map((i)=>e[i]);
      }
      return e
    },
    has: function(path) {
      return this.get(path) !== undefined;
    }
  };
  init.prototype = jsqelem.fn; /* jsonq(0) instanceof jsonq === true */
})();

export { jsonq, jsqelem };
