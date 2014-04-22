function Login() {}

Login.prototype = {
	constructor: Login,

	signIn: function(user, password) {
		casper.fill('#_58_fm', {
			'_58_login': user,
			'_58_password': password
		}, true);

		casper.waitForSelector(
			'.user-avatar-link .user-full-name',
			function onSuccess() {
				casper.echo('User logged successfully');
			},
			function onTimeout() {
				casper.echo("Not logged successfully");
			}
		);
	},

	signOut: function() {
		if(casper.exists('.sign-out a')) {
			casper.click('.sign-out a');

			casper.waitUntilVisible('.sign-in a',
				function onSuccess() {
					casper.echo('Page URL is: ' + casper.getCurrentUrl());

					casper.assertUrlMatch('\/web\/guest\/home', 'User logged out successfully');
				},
				function onFail() {
					casper.echo('User not logged out successfully');
				}
			);
		}
	}
};

module.exports.Login = Login;