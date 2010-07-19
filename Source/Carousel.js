/*
---
script: Carousel.js
license: MIT-style license.
description: Tab - Minimalistic but extensible tab swapper.
copyright: Copyright (c) 2010 Thierry Bela
authors: [Thierry Bela]

requires: 
  core:1.2.3: 
  - Class.Extras
  - Element.Event
  - Element.Style
  - Element.Dimensions
  - Array
provides: [Carousel]
...
*/

(function () {

function style(el, style) {

	var mrg = el.getStyle(style);
	
	return mrg == 'auto' ? 0 : mrg.toInt() 
}

var Carousel = this.Carousel = new Class({

		Implements: [Options, Events],
		options: {
		
		/*
			circular: false,
			onChange: function (index) {
			
			},
			left: element1,
			right: element2,
			container: null,
			selector: '',
		*/
			mode: 'horizontal',
			animation: 'Move',
			scroll: 4,
            distance: 1,
            previous: '',
            next: '',
			fx: {
			
				link: 'cancel',
				transition: 'sine:out',
				duration: 500
			},
		},

		plugins: {},

		initialize: function (options) {
        
			this.addEvent('change', function (current) {
			
				this.current = current
				
			}.bind(this)).setOptions(options);
        
            this.setOptions(options);

			this.elements = $(this.options.container).getChildren(this.options.selector);
			this.current = 0;
			this.anim = new this.plugins[this.options.animation](this);
			
			this.move(this.options.current || 0);
            
            this.boundPrevious = function(){this.previous();}.bind(this);
            this.boundNext = function(){this.next();}.bind(this);
            
            if(this.options.previous) $(this.options.previous).addEvent('click', this.boundPrevious);
            if(this.options.next) $(this.options.next).addEvent('click', this.boundNext);
		},
		
		isVisible: function (index) {
		
			if($type($(index)) == 'element') index = this.elements.indexOf($(index));
			
			var length = this.elements.length,
				current = this.current,
				scroll = this.options.scroll;
			
			if(current <= index && index < current + scroll) return true;
			
			if(this.options.circular) for(var i = 1; i < scroll; i++) {
			
				if((i + current)  % length == index) return true;
			}
			
			return false
		},
		
		first: function () {
		
			return this.current
		},
		
		previous: function (direction) {
	
			return this.move(this.current - this.options.distance, direction)
		},
		
		next: function (direction) {
		
			return this.move(this.current + this.options.distance, direction)
		},

		move: function (index, direction) {
			var elements = this.elements,
				current = this.current,
				length = elements.length,
				scroll = this.options.scroll;
                
			if($type($(index)) == 'element') index = elements.indexOf($(index));
			
			if(!this.options.circular) {
		
				if(index > length - scroll) index = length - scroll
			}	
				
			else {
			
				if(index < 0) index += length
				index %= Math.max(length, 1);

			}			
		
			if(index < 0 || length <= scroll || index >= length) return this;

			if(direction == undefined) {
				
				//detect direction. inspired by moostack
				var forward = current < index ? index - current : elements.length - current + index,
					backward = current > index ? current - index : current + elements.length - index;
				
				direction = Math.abs(forward) <= Math.abs(backward) ? 1 : -1
			}			
			
			this.anim.move(this, index, direction);
			
			return this
		}
	});
	
	Carousel.prototype.plugins.Move = new Class({
	
		initialize: function (carousel) {
		
			var up = this.up = carousel.options.mode == 'vertical',
				options = this.options = carousel.options,
				elements = this.elements = carousel.elements.map(function (el) { 
						
					return el.setStyles({display: 'block', position: 'absolute'})
						
				}),
				parent = elements[0].getParent(),
				pos = parent.setStyles({height: parent.offsetHeight, position: 'relative', overflow: 'hidden'}).getStyle('padding' + (this.up ? 'Top' : 'Left'));
                
				this.property = 'offset' + (up ? 'Top' : 'Left');
				this.margin = 'margin' + (up ? 'Top' : 'Left');
			
			this.reorder(0, 1).fx = new Fx.Elements(elements, options.fx)

            this.fx.addEvent('start', 
                function(){ 
                    if(carousel.options.previous) $(carousel.options.previous).removeEvent('click', carousel.boundPrevious);
                    if(carousel.options.next) $(carousel.options.next).removeEvent('click', carousel.boundNext);
                });
            this.fx.addEvent('complete', 
                function(){ 
                    if(carousel.options.previous) $(carousel.options.previous).addEvent('click', carousel.boundPrevious);
                    if(carousel.options.next) $(carousel.options.next).addEvent('click', carousel.boundNext);
                });

		},
		
		reorder: function (offset, direction) {
		
			var options = this.options,
				panels = this.elements,
				ini = pos = style(panels[0].getParent(), 'padding' + (this.up ? 'Top' : 'Left')),
				i,
				index,
				length = panels.length,
				horizontal = options.mode == 'horizontal',
				side = horizontal ? 'offsetWidth' : 'offsetHeight';
						
			//rtl
			if(direction == -1) {
			
				for(i = length; i > options.scroll - 1; i--) {
			
					index = (i + offset + length) % length;
					panel = panels[index];
					
					if(horizontal) panel.setStyle('left', pos);
					else panel.setStyles({left: 0, top: pos});
					pos -= (panel[side] + style(panel, this.margin));
				}
				
				pos = ini + panel[side] + style(panel, this.margin);
				
				for(i = 1; i < options.scroll; i++) {
			
					index = (i + offset + length) % length;
					
					panel = panels[index];
					
					if(horizontal) panel.setStyle('left', pos);
					else panel.setStyles({left: 0, top: pos});
					pos += panel[side] + style(panel, this.margin);
				}
				
				//ltr
			} else if(direction == 1) for(i = 0; i < length; i++) {
			
				index = (i + offset + length) % length;
				panel = panels[index];				
				
				if(horizontal) panel.setStyle('left', pos);
				else panel.setStyles({left: 0, top: pos});
				pos += panel[side] + style(panel, this.margin);
			}
			
			return this
		},
		
		move: function (carousel, current, direction) {
		
			var obj = {}, 
				up = this.up,
				property = this.property,
				offset;
		
			if(this.options.circular) this.reorder(carousel.current, direction);
			
			offset = carousel.elements[current][property];
			
			carousel.elements.each(function (el, index) {
			
				obj[index] = up ? {top: el[property] - offset} : {left: el[property] - offset}
			});
			
			this.fx.start(obj).chain(function () { carousel.fireEvent('change', current) })
		}
	})
})();