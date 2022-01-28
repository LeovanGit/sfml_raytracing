#include <SFML/Graphics.hpp>
#include <iostream>

int main()
{
    sf::Clock clock;

    sf::Vector2f win_size(sf::VideoMode::getDesktopMode().width, sf::VideoMode::getDesktopMode().height);

    sf::RenderWindow win(sf::VideoMode(win_size.x, win_size.y), "Ray tracing", sf::Style::Fullscreen);
    win.setMouseCursorVisible(false);

    sf::Shader shader;
    shader.loadFromFile("shader.frag", sf::Shader::Fragment);

    sf::Texture texture;
    texture.create(win_size.x, win_size.y);

    sf::Sprite sprite(texture);

    while (win.isOpen())
    {
        sf::Event event;
        while(win.pollEvent(event))
        {
            switch (event.type)
            {
                case sf::Event::Closed:
                {
                    win.close();
                    break;                    
                }

                case sf::Event::Resized:
                {
                    sf::Vector2u tmp(win.getSize());
                    win_size.x = tmp.x;
                    win_size.y = tmp.y;
                    break;
                }

                case sf::Event::KeyPressed:
                {
                    if (event.key.code == sf::Keyboard::Escape) win.close();
                    break;
                }

                default:
                    break;
            }
        }

        win.clear(sf::Color::Black);
        shader.setUniform("time", clock.getElapsedTime().asSeconds());
        shader.setUniform("screen", win_size);
        win.draw(sprite, &shader);
        win.display();
    }
    return 0;
}

