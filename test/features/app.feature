Feature: Basic App Functionality
  As a user
  I want to interact with the app
  So that I can use its features

  Scenario: App loads successfully
    Given I am on the homepage
    Then I should see the app content

  Scenario: Button click interaction
    Given I am on the homepage
    When I click the button
    Then I should see the count increase to "1"

  Scenario: Text input interaction
    Given I am on the homepage
    When I type "Hello World" into the text input
    Then I should see "Hello World" displayed in the text value

  Scenario: Text input clear and update
    Given I am on the homepage
    When I type "First Text" into the text input
    And I clear the text input
    And I type "New Text" into the text input
    Then I should see "New Text" displayed in the text value 