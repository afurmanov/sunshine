---
Author: Aleksandr Furmanov
title: Decoupling with Promises, Events and Observable Properties
Date: 09/28/2013

<a id="top"></a>
In this post I want to show how different signaling tools could help
to break code dependencies: first we consider a contrived example of
coupled code, then we eliminate dependencies using different techniques:
*Promises*, *Observable Properties* and *Events*, and then I
elaborate on those techniques and discuss their pros and cons.

<br/>

### Sun knows about everything? May be in ancient religion, not in our app.

Lets create tiny application the whole goal of which is to enlighten the
room when sun shine: [^1]

(All example could be found at: [https://github.com/afurmanov/sunshine](https://github.com/afurmanov/sunshine))


    var $roomView = $("<div></div>");
    var Sun = function() {
      return {
        shine : function() {
          $roomView.attr('class', 'light');
        }
      };
    }

    var sun = new Sun();

    describe("the room", function() {
      it( "becomes light when sun shine", function() {
        sun.shine();
        expect($roomView).toHaveClass('light');
      });
    })

Even in real word the sun physically emits electromagnetic waves which
when reflected from room internals make us think of room as being
"light", why the sun should be aware about all this chain of events!?
Sun does not know what causality effects are being created by its
activity, why it does know it in our application? If we keep follow this
approach then we would make sun know about houses, trees,
etc. virtually about every object on the Earth. Adding new object
would likely result in updating sun behavior, our design would become
very messy very fast.

<br/>

&nbsp;&nbsp;Basically the way to break the dependency is to make sun object to
signal about its state change, and make signal listeners responsible
for handling the signal. That's in general. In practice it could be
done in many different ways, we consider three of them: *Events*, *Observable
Properties*, *Promises*. Lets begin with most commonly known, *Events*.

<br/>

###   Events

Lets say when sun emits an event, we dispatch it as event with name *'SUN.SHINE'*:

    var Sun = function() {
      return {
        shine : function() {
          EventsHub.dispatch('SUN.SHINE')
        }
      };
    }
    var sun = new Sun();

I use *EventsHub* class here, which is simplest implementation of
[Publisher/Subscriber](http://en.wikipedia.org/wiki/Publish%E2%80%93subscribe_pattern)
pattern. I found pretty good chapter about Events Hub particular and
Event oriented design in general in the book "Testable
JavaScript"[^2]. The *$roomView* could be implemented as:

    var $roomView = $("<div></div>");

    var RoomView = function() {
      EventsHub.subscribe( 'SUN.SHINE', function() {
        $roomView.attr('class', 'light');
      })
    };

    var roomView = new RoomView();

The  *roomView*  and *sun* know nothing about each other, however they
both depend on *EventsHub* singleton and signal with name
*'SUN.SHINE'*.


<br/>

###   Observable Properties

This is not so widely known pattern as *Publisher/Subscriber*, however
it could be tremendously useful in GUI programming which often
built around on one or another variation of *MVC* pattern. The idea
is that Model exposes *properties*, *property* is something having *name*
and *value* and one could get "subscribed" to property *value* changes
using property *name*. The very good demonstration of this pattern is
[Ember.Observable Class](http://emberjs.com/api/classes/Ember.Observable.html).
Other well known example is what is called
[Key Value Coding](https://developer.apple.com/library/ios/documentation/general/conceptual/DevPedia-CocoaCore/KeyValueCoding.html#//apple_ref/doc/uid/TP40008195-CH25-SW1)
in Cocoa. Here is the our app rewritten with using *Ember.Observable* [^5]:

    var Sun = function() {
      return {
        shining : null
      }
    };

    var sun = new Sun();

    var $roomView = $("<div></div>");

    var RoomView = function() {
      Ember.addObserver(sun, 'shining', function() {
        if (Ember.get(sun, 'shining')) {
          $roomView.attr('class', 'light');
        } else {
          $roomView.attr('class', 'dark');
        }
      });
    };

    var roomView = new RoomView();

    describe("the room", function() {
      it( "becomes light when sun shine", function() {
        Ember.set(sun, 'shining', true);
        expect($roomView).toHaveClass('light');
      });
    })

This is very similar to the previous example, we replaced method
*sun.shine()* emitting signal *'SUN.SHINE'* with property *shining* and
instead of subscribing to the event:

    EventsHub.subscribe( 'SUN.SHINE', function() {...

we rather watching for *shining* property change:

    Ember.addObserver(sun, 'shining', function() {...

Not like in the *Events* pattern, here we could see the *roomView*
**knows** about *sun*, and even more, it knows the sun have boolean
property *shining*. So, comparing to the *Events* approach the
*roomView* becomes more knowledgeable, however it is not a problem
since such knowledge is local to the *roomView*, not like the global
knowledge of *sun* object about everything (see the first example).

<br/>
###   Promises

Promises are way to make a code handling some event assumption-free of
the moment the event is taking the place, i.e. event could already has
happened or it might happen in the future. Promises are becoming more
and more popular among JavaScript programmers and we could use them to
solve our decoupling problem:

    var Sun = function() {
      var _shinePromise = $.Deferred();
      return {
        whenShine : function() {
          return _shinePromise.promise();
        },
        shine : function() {
          _shinePromise.resolve();
        }
      };
    }
    var sun = new Sun();

    var $roomView = $("<div></div>");

    var RoomView = function() {
      _lightenRoom = function() {
        $roomView.attr('class', 'light');
      }
      sun.whenShine().then(_lightenRoom);
    };

    var roomView = new RoomView();

    describe("the room", function() {
      it( "becomes light when sun shine", function() {
        sun.shine();
        expect($roomView).toHaveClass('light');
      });
    })

As in previous example with *Observable Properties* the *roomView*
knows about the *sun*, however it uses universal *Promises API* to get
notified rather than custom property *shining*. What is going to
happen if we call *sun.shine()* second time? If we want repetitiveness,
i.e. if we expect our *_lightenRoom()* callback get executed every
time sun shows up, we have to:


- re-create promise every time after it gets resolved
- "re-subscribe" to that promise using *then()*

This of cause is not very clean way to process repetitive event, which
means *Promises* are not good for modeling repetitiveness. However, if
we imagine hypothetical case when sun shine only **once** in our app,
then *Promise* would just serve us fine for breaking coupled code.

<br/>

###    Comparison

All three - *Events*, *Promises* and *Observable Properties* allow
*sun* model to signal about its new state and do not "think" about who
and how is going to process that signal. However there are important
differences between those three approaches:

<br/>
#### *Coupling between signal emitter and receiver*

It is lowest for *Events* when combined with
*Publisher/Subscriber* pattern and highest for *Observable
Properties*, which turns out to be not a problem but rather natural way to
express dependencies.

<br/>

#### *Abstraction*
*Events* are very abstract signaling tool, signaling an event is basically saying:

> Something unique has happened, here is some value at the current moment
> of time.

They do not express in any way that event should happen *before* or
*after* another event, or *value* becomes equal to something
interesting so we should take some action. You may find other patterns
handy in such situations:

If we want to express some time sequence of events we have to use
*Promises*, they are basically a tool for organizing events in flow like:

    wait for Event1, when it happens, then
      wait for Event2, when it happens, then
        wait for Event3, when it happens, then
          ...
    otherwise process failure

If we want to build control flow around values changes we have to use *Object
Properties*, they are basically a tool for building data flow like:

    watch Value1, when it changes do Action1 (and may be update other Value)
    watch Value2, when it changes do Action2 (and may be update other Value)


<br/>

#### *Parameters*

Any parameters could be associated with *Event* or with *Promise*
when latter get resolved. The *Object Properties* do not have
parameters since value associated with signal is the property value.

<br/>


#### *Repetitiveness*

Depending on what kind of repetitiveness we are talking about we could
use different signaling pattern. For example, sun not always shine. It
might not shine in months. But eventually it will. For this case the
best way to model repetitiveness would be to watch for *shining*
property of object *sun*, i.e to use *Object Properties*, it would be
more expressive than *Events*, and *Promises* would not serve us well
since we dealing with repetitive event, and *Promise* supposed to be
resolved once. If, say, we are talking about event which
happens **every minute**, then we have couple choices: use *Events* with
timers or use *Observable Property* with property changing every
minute. The details of how exactly property changes every minute could
be considered as hidden implementation details.  <br/> <br/> <br/>

-------------------------------------------------------------------------------

I hope all those considerations would help you to use a right
weapon in combating coupled code. Write some comments and let me know
what you are thinking!

<br/>

[^1]: Here and below I am using [jQuery](http://jquery.com/) and Jasmine libraries

[^2]: [Testable JavaScript, Chapter 3 "Event-Based Architectures"](http://www.amazon.com/Testable-JavaScript-Mark-Ethan-Trostler/dp/1449323391) by Mark Ethan Trostler

[^5]: We need only Ember.Metal package, not entire Ember.js
