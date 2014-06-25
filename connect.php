<?php 
	session_start();
	require_once('lib/twitteroauth/twitteroauth.php');
	require_once('lib/twitteroauth/config.php');

	if (array_key_exists('access_token', $_SESSION)) {
		/* Get user access tokens out of the session. */
		$access_token = $_SESSION['access_token'];

		/* Create a TwitterOauth object with consumer/user tokens. */
		$connection = new TwitterOAuth(CONSUMER_KEY, CONSUMER_SECRET, $access_token['oauth_token'], $access_token['oauth_token_secret']);
		
		$user = $connection->get('account/verify_credentials');
		$tweets = $connection->get('statuses/user_timeline', array('screen_name' => $_REQUEST['username'], 'count' => 200));

		$data = array("user" => $user, "tweets" => $tweets);

		echo json_encode($data);
	} else {
		echo json_encode(array("error" => "not signed in to twitter"));
	}
?>