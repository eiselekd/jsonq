import _ from 'underscore';

var jsonq;
var jsqelem;

//################################
// queries
(()=>{
  jsonq = function (items, path, parent) {
    if (items instanceof jsonq) {
      return new jsonq.fn.init([].concat(items.items));
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
      this.items = this.items.flatMap((e)=>{
	if (_.isArray(e.elem) && isNaN(step)) {
	  /* non-index on a array : iterate and hash over all */
	  return e.resolveArray().map((e)=>e.step(step));
	}
	return e.step(step);
      });
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
      console.log(`-----------\nstep:'${step}' on '${this.elem}' => ${next}`);
      console.log(this.elem);
      console.log(next);
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
      for (const step of path.split(/\//).filter((e)=>e!=="@")) {
	e = e[step];
	if (e === undefined) {
	  return undefined;
	}
      }
      return e
    }
  };
  init.prototype = jsqelem.fn; /* jsonq(0) instanceof jsonq === true */
})();

export default jsonq;
