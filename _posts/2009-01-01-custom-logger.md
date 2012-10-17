--- 
category: reference
heading: Custom logger
---

Elsewhere use a simple logging system that writes to Node's console. You can replace the logger with your own, for example, to store warnings and errors in a database or log file. To add your own custom logger, all you need to do is provide an object contain the following interface:

	{
	    function info (message) { /* code to pass on message */ }
	    function log  (message) { /* code to pass on message */ }
	    function warn (message) { /* code to pass on message */ }
	    function error(message) { /* code to pass on message */ }
	}

and then add this interface to the `logger` property of the options object passed into the `graph()` method.
