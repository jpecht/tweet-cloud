<?php 
	session_start();
	require_once('lib/twitteroauth/twitteroauth.php');
	require_once('lib/twitteroauth/config.php');

	/* Get user access tokens out of the session. */
	$access_token = $_SESSION['access_token'];

	/* Create a TwitterOauth object with consumer/user tokens. */
	$connection = new TwitterOAuth(CONSUMER_KEY, CONSUMER_SECRET, $access_token['oauth_token'], $access_token['oauth_token_secret']);
	
	$user = $connection->get('account/verify_credentials');
	$tweets = $connection->get('statuses/user_timeline', array('screen_name' => 'jpmogli', 'count' => 200));

	//$test = $connection->get('users/show', array('screen_name' => 'jpmogli'));
?>

<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN"
"http://www.w3.org/TR/html4/strict.dtd">

<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
	<head>
		<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
		<title>Jefferson Pecht</title>
		<meta name="author" content="jpecht" />

		<link rel="stylesheet" href="css/main.css" type="text/css" />
		<link rel="stylesheet" href="css/normalize.css" type="text/css" />
		<link rel="stylesheet" href="http://netdna.bootstrapcdn.com/bootstrap/3.1.1/css/bootstrap.min.css" type="text/css" />
		<link href='http://fonts.googleapis.com/css?family=Source+Sans+Pro:300,400,600' rel='stylesheet' type='text/css'>

		<script src="http://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js"></script>
        <script src="http://netdna.bootstrapcdn.com/bootstrap/3.1.1/js/bootstrap.min.js"></script>
        <script src="http://d3js.org/d3.v3.min.js"></script>
        <script src="lib/d3-cloud/d3.layout.cloud.js"></script>
	</head>
	<body>
		<nav class="navbar navbar-default navbar-fixed-top" role="navigation">
			<div id="header"><h1>Tweet Cloud</h1></div>
		</nav>
		<div id="signInButton">
			<!-- <button type="button" class="btn btn-info">Tweet Word Cloud</button> -->
			<a href="./lib/twitteroauth/redirect.php"><img src="img/lighter.png" alt="Sign in with Twitter"/></a>	
		</div>
		<div id="word_cloud_container"></div>

        <script type="text/javascript">
        	var user = <?php echo json_encode($user); ?>;
        	var tweets = <?php echo json_encode($tweets); ?>;
        </script> 
        <script src="main.js"></script>
	</body>
</html>