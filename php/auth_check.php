<?php 
	session_start();

	if (array_key_exists('access_token', $_SESSION)) {
		echo $_SESSION['access_token']['screen_name'];
	} else {
		echo NULL;
	}	
?>