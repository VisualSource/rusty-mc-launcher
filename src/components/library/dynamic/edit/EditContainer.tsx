import { memo, useCallback, useState } from "react";
import update from 'immutability-helper'
import { Plus, } from "lucide-react";
import { useDrop } from "react-dnd";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { OPTIONS, ItemTypes, type Card, STORAGE_KEY } from "../EditConsts";
import { Command, CommandItem, CommandList } from "@/components/ui/command";
import { queryClient } from "@/lib/api/queryClient";
import { Button } from "@/components/ui/button";
import { CardItem } from "./CardItem";
import { nanoid } from "@/lib/nanoid";

const getLocalState = () => {
    try {
        const items = localStorage.getItem(STORAGE_KEY)
        if (!items) return [];

        return JSON.parse(items) as Card[];
    } catch (error) {
        console.error(error);
        return [];
    }
}

export const EditContainer: React.FC<{ setEditMode: React.Dispatch<React.SetStateAction<boolean>> }> = memo(({ setEditMode }) => {
    const [cards, setCards] = useState(getLocalState());
    const [popoverOpen, setPopoverOpen] = useState(false);

    const findCard = useCallback(
        (id: string) => {
            const card = cards.filter((c) => c.id === id)[0] as Card;
            return {
                card,
                index: cards.indexOf(card),
            }
        },
        [cards],
    );

    const moveCard = useCallback(
        (id: string, atIndex: number) => {
            const { card, index } = findCard(id);

            setCards(e => update(e, {
                $splice: [
                    [index, 1],
                    [atIndex, 0, card],
                ],
            }))

        },
        [findCard],
    );

    const deleteCard = useCallback((id: string) => {
        const { index } = findCard(id);

        setCards((e) => {
            const data = update(e, {
                $splice: [
                    [index, 1]
                ]
            });
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            return data;
        });
    }, [findCard]);

    const writeState = useCallback(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
    }, [cards]);

    const addCard = useCallback((id: string, type: string) => {
        setCards((data) => {
            const next = [...data, { id, type, params: {} } as Card]
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            return next;
        });
    }, []);

    const updateCard = useCallback((id: string, key: Record<string, unknown>) => {
        const { index } = findCard(id);

        setCards(data => {
            const next = update(data, {
                [index]: key
            })
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            return next;
        })
    }, [findCard]);

    const [, drop] = useDrop(() => ({ accept: ItemTypes.CARD }));
    return (
        <div className="space-y-4 container" ref={drop}>
            <Button onClick={() => {
                queryClient.invalidateQueries({ queryKey: ["HOME_LAYOUT"] });
                setEditMode(false)
            }} size="sm" className="w-full">
                Done
            </Button>

            {cards.map(card => (
                <CardItem key={card.id} id={card.id} type={card.type}
                    findCard={findCard}
                    moveRow={moveCard}
                    writeState={writeState}
                    deleteCard={deleteCard}
                    updateCard={updateCard} />
            ))}

            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full" size="sm">
                        <Plus />
                    </Button>
                </PopoverTrigger>
                <PopoverContent>
                    <Command>
                        <CommandList>
                            {Object.values(OPTIONS).map((item) => (
                                <CommandItem key={item.id} onSelect={() => {
                                    addCard(nanoid(8), item.id);
                                    setPopoverOpen(false);
                                }}>
                                    {item.title}
                                </CommandItem>
                            ))}
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
});


