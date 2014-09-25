<?php
	session_start();
	require_once('twitteroauth.php');
	require_once('config.php');

	if (array_key_exists('access_token', $_SESSION)) {
		$access_token = $_SESSION['access_token'];
		$connection = new TwitterOAuth(CONSUMER_KEY, CONSUMER_SECRET, $access_token['oauth_token'], $access_token['oauth_token_secret']);
		$connection->post('oauth2/invalidate_token');
		echo 'success';
	} else {
		echo 'error';
	}
?>