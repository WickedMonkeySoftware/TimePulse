FROM_ADDRESS     = "noreply@wickedmonkeysoftware.com"
REPLY_TO_ADDRESS = "robert@wickedmonkeysoftware.com"

ActionMailer::Base.smtp_settings = {
  :address              => "mail.wickedmonkeysoftware.com",
  :port                 => 465,
  :domain               => "wickedmonkeysoftware.com",
  :user_name            => "robert@wickedmonkeysoftware.com",
  :password             => "shadow9637",
  :authentication       => :plain,
  :raise_delivery_errors => (Rails.env.development?),
  :enable_starttls_auto => true
}


class DevelopmentMailInterceptor
  def self.delivering_email(message)
    message.subject = "#{message.to} #{message.subject}"
    message.to      = "xxxxxx@lrdesign.com"   # Set this to your email address for development!
  end
end

ActionMailer::Base.default_url_options[:host] = "localhost:3000"
ActionMailer::Base.register_interceptor(DevelopmentMailInterceptor) if Rails.env.development?
