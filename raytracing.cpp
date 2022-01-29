#include <SFML/Graphics.hpp>
#include <iostream>
#include <cmath>

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

    sf::Mouse::setPosition(sf::Vector2i(win_size / 2.0f));
    sf::Vector2f mouse_pos(0, 0);
    float mouse_sensitivity = 0.2;

    float zoom = 2.0;

    bool shadows = true;
    bool point_light = false;
    bool mirror = true;
    bool colors = true;
    float light_power = 1.0;

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
                    else if (event.key.code == sf::Keyboard::Q) shadows = !shadows;
                    else if (event.key.code == sf::Keyboard::W) point_light = !point_light;
                    else if (event.key.code == sf::Keyboard::E) mirror = !mirror;
                    else if (event.key.code == sf::Keyboard::R) colors = !colors;
                    else if (event.key.code == sf::Keyboard::D) light_power += 0.1;
                    else if (event.key.code == sf::Keyboard::F) light_power -= 0.1;
                    break;
                }

                case sf::Event::MouseMoved:
                {
                    mouse_pos.x += int(event.mouseMove.x - win_size.x / 2.0f) % 360 * mouse_sensitivity;
                    mouse_pos.y += int(event.mouseMove.y - win_size.y / 2.0f) % 360 * mouse_sensitivity;
                    mouse_pos.y = fmax(-90, fmin(mouse_pos.y, 90));
                    break;
                }
                
                case sf::Event::MouseWheelMoved:
                {
                    zoom -= event.mouseWheel.delta;
                    zoom = fmax(0.2, zoom);
                }

                default:
                    break;
            }
        }
        sf::Mouse::setPosition(sf::Vector2i(win_size / 2.0f));

        win.clear(sf::Color::Black);
        shader.setUniform("time", clock.getElapsedTime().asSeconds());
        shader.setUniform("screen", win_size);
        shader.setUniform("mouse_pos", mouse_pos);
        shader.setUniform("zoom", zoom);
        shader.setUniform("shadows", shadows);
        shader.setUniform("real_point", point_light);
        shader.setUniform("mirror", mirror);
        shader.setUniform("colors", colors);
        shader.setUniform("light_power", light_power);
        win.draw(sprite, &shader);
        win.display();
    }
    return 0;
}

