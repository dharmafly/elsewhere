--- 
heading: Custom Logger
category: reference
---

Elsewhere use a simple logging system that write out to node console. You can replace the logger with your own functionally if you want store warnings and error into database or log file. To add you own custom logger all you need to do is provide an object contain the following interface:


	{
	    function info(message) { // add code to pass on massage }
	    function log (message) { // add code to pass on massage }
	    function warn  (message) { // add code to pass on massage }
	    function error (message) { // add code to pass on massage }
	}


You simply attach you logger object to the 'option.logger' property and pass it into 'elsewhere.graph' method.